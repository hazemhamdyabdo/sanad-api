import { z } from 'zod';
import { LEVELS, QUALITY_ISSUE_TYPES, SENIORITY_LEVELS, type SectionConfidence, type SectionId } from '../../common/types/contract.js';
import {
  basicCardSchema,
  certificatesCardSchema,
  educationCardSchema,
  experienceCardSchema,
  languagesCardSchema,
  projectEntrySchema,
  skillsCardSchema,
} from './section-reply.schema.js';

const text = () => z.string().trim().min(1);

/** Unlike languages, a skill level is never "native". */
const SKILL_LEVELS = LEVELS.filter((level) => level !== 'native') as Exclude<(typeof LEVELS)[number], 'native'>[];

const skillWithYearsSchema = z.object({
  name: text(),
  level: z.enum(SKILL_LEVELS),
  /** Rarely inferable for a soft skill — nullable everywhere rather than only on that one bucket, to keep the three arrays the same shape. */
  yearsUsed: z.number().min(0).max(60).nullable(),
});

/**
 * The CV fields an upload analysis produces — one schema per section, reusing the exact validators
 * the live conversation already extracts cards against (`CARD_SCHEMA_BY_SECTION`), so a section
 * saved from an upload is indistinguishable from one confirmed through the conversation. `projects`
 * is the one deliberate difference: the conversation only ever builds a single project card per
 * turn, but a real CV can list several, so this uses `projectEntrySchema` as an array instead of
 * `CARD_SCHEMA_BY_SECTION.projects`'s single object.
 */
export const cvAnalysisCvSchema = z.object({
  basic: basicCardSchema,
  experience: experienceCardSchema,
  projects: z.array(projectEntrySchema),
  education: educationCardSchema,
  certificates: certificatesCardSchema,
  skills: skillsCardSchema,
  languages: languagesCardSchema,
});

export type CvAnalysisCv = z.infer<typeof cvAnalysisCvSchema>;

/**
 * The model's raw output for `POST /cv/uploads`'s analysis. Deliberately has NO confidence/quality
 * self-grading field — `sectionConfidence` (which sections are trustworthy enough to save
 * automatically) is computed afterwards in code from this validated data, the same way the live
 * conversation decides a section is "done": never left to the model's own judgment of itself.
 */
export const cvAnalysisSchema = z.object({
  cv: cvAnalysisCvSchema,
  seniority: z.enum(SENIORITY_LEVELS),
  yearsOfExperience: z.number().min(0).max(60).nullable(),
  skills: z.object({
    technical: z.array(skillWithYearsSchema),
    tools: z.array(skillWithYearsSchema),
    soft: z.array(skillWithYearsSchema),
  }),
  /** Short canonical English tags (e.g. "fintech", "e-commerce") — kept in English so job-matching data (also English) can compare directly. */
  domains: z.array(text()),
  /** Egyptian Arabic — shown straight to the user, same convention as every other user-facing string in this app. */
  strengths: z.array(text()),
  gaps: z.array(text()),
  qualityIssues: z.array(
    z.object({
      type: z.enum(QUALITY_ISSUE_TYPES),
      description: text(),
    }),
  ),
  overallScore: z.number().int().min(0).max(100),
  scoreReason: text(),
});

export type CvAnalysisOutput = z.infer<typeof cvAnalysisSchema>;

/** `CvAnalysisOutput` plus the deterministic per-section confidence computed from it — see `computeSectionConfidence` in `ai/services/cv-analysis.service.ts`. */
export interface CvAnalysisResult extends CvAnalysisOutput {
  sectionConfidence: Record<SectionId, SectionConfidence>;
}
