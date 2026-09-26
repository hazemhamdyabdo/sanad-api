import { Inject, Injectable, Logger } from '@nestjs/common';
import { EXTRACTION_LLM_PROVIDER, type LlmProvider } from '../../integrations/llm/llm.interface.js';
import { buildCvTailorPrompt } from '../prompts/cv-tailor.prompt.js';
import { cvTailorOutputSchema, type TailorCvInput, type TailorJobInput, type TailoredCvContent } from '../schemas/cv-tailor.schema.js';

const MAX_ATTEMPTS = 2;
const TAILOR_MAX_TOKENS = 3_000;
/** Rewording one CV's bullets is a short call; past this the application goes out with the CV as written rather than waiting. */
const TAILOR_CALL_TIMEOUT_MS = 45_000;

function extractJsonObject(raw: string): string {
  const trimmed = raw.trim();
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  return start === -1 || end < start ? trimmed : trimmed.slice(start, end + 1);
}

/**
 * Tokens that carry checkable facts: anything with a digit (numbers, "300+", "5%"), a capital letter
 * after the first character or an all-caps acronym (IFRS, PostgreSQL), a tool-ish symbol (Node.js,
 * C#), or a capitalized word that isn't the bullet's first word (Salesforce, Microsoft).
 */
function factTokens(bullet: string): string[] {
  const words = bullet.match(/[\p{L}\p{N}][\p{L}\p{N}.+#%/-]*/gu) ?? [];
  return words
    .filter((word, index) => /\d/.test(word) || /.\p{Lu}/u.test(word) || /[.+#]/.test(word.replace(/\.$/, '')) || (index > 0 && /^\p{Lu}/u.test(word)))
    .map((word) => word.replace(/[.,;:]+$/, '').toLowerCase());
}

/**
 * The "never invent" rule, enforced in code rather than trusted: a reworded bullet may only contain
 * fact tokens that already appear somewhere in the same entry (its title, company, description or
 * original bullets). A fact moved in from another job, or from the listing, fails.
 */
function introducesNewFacts(bullet: string, entrySource: string): boolean {
  const source = entrySource.toLowerCase();
  return factTokens(bullet).some((token) => !source.includes(token));
}

/**
 * Per entry, all or nothing: the model's bullets are used only if there's exactly one reworded
 * bullet per original and none introduces a new fact; otherwise the original bullets stay.
 */
function acceptBullets(original: string[], proposed: string[] | undefined, entrySource: string): string[] | null {
  if (!proposed || proposed.length !== original.length) {
    return null;
  }
  return proposed.some((bullet) => introducesNewFacts(bullet, entrySource)) ? null : proposed;
}

/** A pure reorder of the real skills — unknown names dropped, missing ones appended in their original order. */
function acceptSkillOrder(skills: string[], proposed: string[]): string[] {
  const byKey = new Map(skills.map((skill) => [skill.trim().toLowerCase(), skill]));
  const ordered: string[] = [];
  for (const name of proposed) {
    const skill = byKey.get(name.trim().toLowerCase());
    if (skill && !ordered.includes(skill)) ordered.push(skill);
  }
  return [...ordered, ...skills.filter((skill) => !ordered.includes(skill))];
}

/**
 * Tailors the CV to one listing: reorders and rewords bullets, reorders skills — nothing else, and
 * nothing that isn't already in the CV. Never throws for a model problem: the worst case is the
 * untouched CV with `tailored: false`, which is still an honest application.
 */
@Injectable()
export class CvTailorService {
  private readonly logger = new Logger(CvTailorService.name);

  constructor(@Inject(EXTRACTION_LLM_PROVIDER) private readonly llm: LlmProvider) {}

  async tailor(cv: TailorCvInput, job: TailorJobInput): Promise<TailoredCvContent> {
    const untouched: TailoredCvContent = {
      experienceBullets: cv.experience.map((entry) => entry.bullets),
      projectBullets: cv.projects.map((entry) => entry.bullets),
      skillOrder: cv.skills,
      tailored: false,
    };
    const hasBullets = [...cv.experience, ...cv.projects].some((entry) => entry.bullets.length > 1);
    if (!hasBullets && cv.skills.length < 2) {
      return untouched; // nothing to reorder or reword
    }

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      let raw: string;
      try {
        raw = await this.llm.complete({ messages: buildCvTailorPrompt(cv, job), temperature: 0, jsonMode: true, maxTokens: TAILOR_MAX_TOKENS, timeoutMs: TAILOR_CALL_TIMEOUT_MS });
      } catch (error) {
        this.logger.warn(`CV tailoring call failed on attempt ${attempt + 1}: ${error instanceof Error ? error.message : String(error)}`);
        continue;
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(extractJsonObject(raw));
      } catch {
        this.logger.warn(`CV tailoring output was not valid JSON on attempt ${attempt + 1}.`);
        continue;
      }
      const result = cvTailorOutputSchema.safeParse(parsed);
      if (!result.success) {
        this.logger.warn(`CV tailoring output failed validation on attempt ${attempt + 1}: ${result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join(', ')}`);
        continue;
      }

      const proposedExperience = new Map(result.data.experience.map((entry) => [entry.index, entry.bullets]));
      const proposedProjects = new Map(result.data.projects.map((entry) => [entry.index, entry.bullets]));
      let rejectedEntries = 0;
      /** Entries whose bullets actually changed (reordered or reworded) and passed every check. */
      let acceptedEntries = 0;

      const experienceBullets = cv.experience.map((entry, index) => {
        const accepted = acceptBullets(entry.bullets, proposedExperience.get(index), [entry.title, entry.company, ...entry.bullets].join('\n'));
        if (accepted?.some((bullet, position) => bullet !== entry.bullets[position])) acceptedEntries++;
        else if (!accepted && entry.bullets.length) rejectedEntries++;
        return accepted ?? entry.bullets;
      });
      const projectBullets = cv.projects.map((entry, index) => {
        const accepted = acceptBullets(entry.bullets, proposedProjects.get(index), [entry.title, entry.description, ...entry.bullets].join('\n'));
        if (accepted?.some((bullet, position) => bullet !== entry.bullets[position])) acceptedEntries++;
        else if (!accepted && entry.bullets.length) rejectedEntries++;
        return accepted ?? entry.bullets;
      });
      const skillOrder = acceptSkillOrder(cv.skills, result.data.skillOrder);

      if (rejectedEntries) {
        this.logger.warn(`CV tailoring: kept the original bullets for ${rejectedEntries} entr${rejectedEntries === 1 ? 'y' : 'ies'} (wrong bullet count or a fact not in the CV).`);
      }
      const skillsChanged = skillOrder.some((skill, index) => skill !== cv.skills[index]);
      return { experienceBullets, projectBullets, skillOrder, tailored: acceptedEntries > 0 || skillsChanged };
    }

    this.logger.warn('CV tailoring failed after all attempts — using the CV as written.');
    return untouched;
  }
}
