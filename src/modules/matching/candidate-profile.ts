import { createHash } from 'node:crypto';
import type { MatchCandidate } from '../../ai/index.js';
import type { Seniority } from '../../common/types/contract.js';
import type { CvAnalysisResponseDto } from '../cv/index.js';
import { buildEmbeddingText, groupLabel, type RoleDefinition } from '../jobs/index.js';

/** The `GET /cv` shape, as far as matching reads it — sections stay `unknown[]` and are read defensively below. */
export interface CvForMatching {
  name: string | null;
  title: string | null;
  experience: unknown[];
  projects: unknown[];
  education: unknown[];
  certificates: unknown[];
  skills: unknown[];
  languages: unknown[];
}

const MONTH_MS = 30.44 * 24 * 60 * 60 * 1000;
/** Enough evidence for the explainer without bloating every batch's prompt. */
const MAX_HIGHLIGHTS = 12;

function str(entry: unknown, key: string): string | null {
  if (entry && typeof entry === 'object' && key in entry) {
    const value = (entry as Record<string, unknown>)[key];
    return typeof value === 'string' && value.trim() ? value.trim() : null;
  }
  return null;
}

function strings(entries: unknown[], format: (entry: unknown) => string | null): string[] {
  return entries.map(format).filter((value): value is string => value !== null);
}

/** "03/2023", "2023", "Present"/null (= now) → a Date, or null when unreadable. */
function parseCvDate(value: string | null, isEnd: boolean): Date | null {
  if (!value || /present|current|now|حالي|الآن/i.test(value)) {
    return isEnd ? new Date() : null;
  }
  const monthYear = /(\d{1,2})\s*[/-]\s*(\d{4})/.exec(value);
  if (monthYear) {
    return new Date(Number(monthYear[2]), Number(monthYear[1]) - 1, 1);
  }
  const year = /(\d{4})/.exec(value);
  return year ? new Date(Number(year[1]), isEnd ? 11 : 0, 1) : null;
}

/** Summed from the experience entries' dates — used only when there's no upload analysis to take `yearsOfExperience` from. */
function yearsFromExperience(experience: unknown[]): number | null {
  let months = 0;
  let counted = false;
  for (const entry of experience) {
    const start = parseCvDate(str(entry, 'start'), false);
    const end = parseCvDate(str(entry, 'end'), true);
    if (start && end && end > start) {
      months += (end.getTime() - start.getTime()) / MONTH_MS;
      counted = true;
    }
  }
  // Whole years — "3.3 سنة" reads badly in a whyMatch line, and nothing downstream needs more precision.
  return counted ? Math.round(months / 12) : null;
}

function seniorityFromYears(years: number | null, hasExperience: boolean): Seniority {
  if (!hasExperience || years === null || years < 2) {
    return 'junior';
  }
  return years < 5 ? 'mid' : 'senior';
}

function sameName(a: string | null, b: string | null): boolean {
  return !!a && !!b && a.trim().toLowerCase() === b.trim().toLowerCase();
}

/**
 * The candidate as matching sees it. The confirmed CV (`GET /cv`) is the source of truth — it has
 * the user's own edits. The upload analysis adds what the CV itself doesn't carry (seniority,
 * years, domains, skills with years), but only when it's plausibly about the same CV: a device can
 * upload a CV and later rebuild a different one from scratch, and that old analysis must not leak
 * into the new CV's matches. With no confirmed CV at all, the analysis's own CV fields are used.
 * Returns null when there's nothing to match on (no title, no past titles, no skills).
 */
export function buildMatchCandidate(cv: CvForMatching | null, analysis: CvAnalysisResponseDto | null): MatchCandidate | null {
  const usableAnalysis = analysis && (!cv || !cv.name || sameName(cv.name, analysis.cv.basic.name)) ? analysis : null;
  const source: CvForMatching | null =
    cv ??
    (usableAnalysis
      ? {
          name: usableAnalysis.cv.basic.name,
          title: usableAnalysis.cv.basic.title,
          experience: usableAnalysis.cv.experience,
          projects: usableAnalysis.cv.projects,
          education: usableAnalysis.cv.education,
          certificates: usableAnalysis.cv.certificates,
          skills: usableAnalysis.cv.skills,
          languages: usableAnalysis.cv.languages,
        }
      : null);
  if (!source) {
    return null;
  }

  const pastTitles = strings(source.experience, (entry) => str(entry, 'title'));
  const skills = strings(source.skills, (entry) => str(entry, 'name'));
  if (!skills.length && usableAnalysis) {
    const { technical, tools, soft } = usableAnalysis.skills;
    skills.push(...[...technical, ...tools, ...soft].map((skill) => skill.name));
  }
  if (!source.title && !pastTitles.length && !skills.length) {
    return null;
  }

  const analysisYears = usableAnalysis?.yearsOfExperience;
  const yearsOfExperience = usableAnalysis ? (analysisYears == null ? null : Math.round(analysisYears)) : yearsFromExperience(source.experience);
  const bullets = (entry: unknown): string[] => {
    const value = entry && typeof entry === 'object' ? (entry as Record<string, unknown>).bullets : null;
    return Array.isArray(value) ? value.filter((bullet): bullet is string => typeof bullet === 'string' && !!bullet.trim()) : [];
  };
  const highlights = [
    ...source.experience.flatMap(bullets),
    ...source.projects.flatMap((project) => [str(project, 'title'), str(project, 'description'), ...bullets(project)].filter((line): line is string => !!line)),
  ].slice(0, MAX_HIGHLIGHTS);

  return {
    title: source.title,
    pastTitles,
    highlights,
    seniority: usableAnalysis?.seniority ?? seniorityFromYears(yearsOfExperience, pastTitles.length > 0),
    yearsOfExperience,
    skills,
    domains: usableAnalysis?.domains ?? [],
    education: strings(source.education, (entry) => [str(entry, 'degree'), str(entry, 'school')].filter(Boolean).join(' – ') || null),
    certificates: strings(source.certificates, (entry) => str(entry, 'name')),
    languages: strings(source.languages, (entry) => {
      const name = str(entry, 'name');
      const level = str(entry, 'level');
      return name ? (level ? `${name} (${level})` : name) : null;
    }),
  };
}

/** Same layout as every job's embedding text (see `buildEmbeddingText`): titles, seniority, skills, domain — nothing about location. */
export function buildCandidateEmbeddingText(candidate: MatchCandidate, targetRole: RoleDefinition | null): string {
  return buildEmbeddingText({
    titles: [...(candidate.title ? [candidate.title] : []), ...(targetRole ? [targetRole.labelEn] : []), ...candidate.pastTitles],
    seniority: candidate.seniority,
    skills: candidate.skills,
    domains: [...(targetRole ? [groupLabel(targetRole.group)] : []), ...candidate.domains],
  });
}

/**
 * Everything a cached match depends on from the CV side, as one fingerprint: the candidate data
 * itself and the prompt version that explained it. When it changes, the CV vector is recomputed and
 * every cached explanation for the device is dropped.
 */
export function hashCandidate(candidate: MatchCandidate, promptVersion: string): string {
  return createHash('sha256').update(JSON.stringify({ candidate, promptVersion })).digest('hex');
}
