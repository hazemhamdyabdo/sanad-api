import { Inject, Injectable, Logger } from '@nestjs/common';
import { SECTION_IDS, type SectionConfidence, type SectionId } from '../../common/types/contract.js';
import { EXTRACTION_LLM_PROVIDER, type LlmProvider } from '../../integrations/llm/llm.interface.js';
import { buildCvAnalysisPrompt } from '../prompts/cv-analysis.prompt.js';
import { cvAnalysisSchema, type CvAnalysisCv, type CvAnalysisOutput, type CvAnalysisResult } from '../schemas/cv-analysis.schema.js';

const JSON_ONLY_REMINDER = 'رد بكائن JSON بس، من غير أي نص قبله أو بعده، بالشكل المتفق عليه بالظبط.';
/** One retry is enough here: unlike the live conversation, there's no user to keep talking to — a repeated failure just fails the upload outright rather than looping. */
const MAX_ATTEMPTS = 2;

export type CvAnalysisOutcome = { success: true; data: CvAnalysisResult } | { success: false };

function extractJsonObject(raw: string): string {
  const trimmed = raw.trim();
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) {
    return trimmed;
  }
  return trimmed.slice(start, end + 1);
}

/**
 * Whether a section is trustworthy enough to save into the CV without the user reviewing it first —
 * decided the same way the live conversation decides a card is "done": schema-valid and non-empty,
 * nothing self-reported by the model. See `SectionConfidence`'s doc comment for what each value means.
 */
function computeSectionConfidence(cv: CvAnalysisCv): Record<SectionId, SectionConfidence> {
  const hasBasics = !!cv.basic.name && !!cv.basic.title && (!!cv.basic.phone || !!cv.basic.email);
  const hasExperience = cv.experience.length > 0;
  const hasProjects = cv.projects.length > 0;

  const confidence: Record<SectionId, SectionConfidence> = {
    basic: hasBasics ? 'high' : 'low',
    // A CV with real work history but zero listed projects is normal — 'n/a', not 'low'. Only when
    // there's NEITHER is work history actually missing and worth asking the user about.
    experience: hasExperience ? 'high' : hasProjects ? 'n/a' : 'low',
    projects: hasProjects ? 'high' : 'n/a',
    education: cv.education.length > 0 ? 'high' : 'low',
    // Only certificates may legitimately be empty — same rule as the live conversation.
    certificates: 'high',
    skills: cv.skills.length > 0 ? 'high' : 'low',
    languages: cv.languages.length > 0 ? 'high' : 'low',
  };

  // SECTION_IDS is the source of truth for "every section this app tracks" — asserted here so a
  // future section added there can't silently end up missing from this map.
  for (const id of SECTION_IDS) {
    if (!(id in confidence)) {
      throw new Error(`computeSectionConfidence is missing a rule for section "${id}".`);
    }
  }
  return confidence;
}

/**
 * Reads an uploaded CV PDF directly (no OCR step, no extracted-text intermediate — the model sees
 * the actual document) and produces the structured analysis `POST /cv/uploads` stores. One-shot,
 * not a conversation: on total failure this returns `{ success: false }` rather than degrading to a
 * soft message the way `SectionReplyService` does — there's no chat turn to keep going here, the
 * caller (`UploadService`) marks the upload `failed` instead.
 */
@Injectable()
export class CvAnalysisService {
  private readonly logger = new Logger(CvAnalysisService.name);

  constructor(@Inject(EXTRACTION_LLM_PROVIDER) private readonly llm: LlmProvider) {}

  async analyze(pdf: Buffer, mimeType: string): Promise<CvAnalysisOutcome> {
    const initialMessages = buildCvAnalysisPrompt(pdf, mimeType);
    let messages = initialMessages;

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const raw = await this.llm.complete({ messages, temperature: 0, jsonMode: true });

      let parsed: unknown;
      let retryReason = 'The response was not valid JSON.';
      try {
        parsed = JSON.parse(extractJsonObject(raw));
      } catch {
        this.logger.warn(`CV analysis output was not valid JSON on attempt ${attempt + 1}: ${raw.slice(0, 200)}`);
      }

      if (parsed !== undefined) {
        const result = cvAnalysisSchema.safeParse(parsed);
        if (result.success) {
          return { success: true, data: this.withConfidence(result.data) };
        }
        retryReason = `Fix these schema errors: ${result.error.issues
          .slice(0, 12)
          .map((issue) => `${issue.path.join('.') || 'root'}: ${issue.message}`)
          .join('; ')}`;
        this.logger.warn(`CV analysis output failed validation on attempt ${attempt + 1}: ${JSON.stringify(result.error.issues)}`);
      }

      if (attempt < MAX_ATTEMPTS - 1) {
        // The document only needs to be attached on the first attempt — it's already in the model's
        // context, and re-encoding it into every retry would just bloat the request for no benefit.
        messages = [...messages, { role: 'assistant', content: raw }, { role: 'user', content: `${retryReason}\n${JSON_ONLY_REMINDER}` }];
      }
    }

    this.logger.warn('CV analysis failed after all retries.');
    return { success: false };
  }

  private withConfidence(data: CvAnalysisOutput): CvAnalysisResult {
    return { ...data, sectionConfidence: computeSectionConfidence(data.cv) };
  }
}
