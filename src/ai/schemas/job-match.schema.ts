import { z } from 'zod';

/** The candidate as the match explainer sees it — English CV data, built by `modules/matching` from the CV (+ upload analysis when there is one). */
export interface MatchCandidate {
  title: string | null;
  pastTitles: string[];
  /** Experience bullets and project descriptions — the evidence behind the skills ("Prepared supplier invoices" is invoicing experience). */
  highlights: string[];
  seniority: 'junior' | 'mid' | 'senior' | null;
  yearsOfExperience: number | null;
  skills: string[];
  domains: string[];
  education: string[];
  certificates: string[];
  languages: string[];
}

/** One job to explain — only what the model needs to judge fit. Location and pay are filters, not fit, so they're left out. */
export interface MatchJob {
  id: string;
  title: string;
  company: string | null;
  description: string;
}

export interface JobMatchExplanation {
  jobId: string;
  match: number;
  whyMatch: string[];
  gaps: string[];
}

const ARABIC_LETTER = /[؀-ۿ]/;
/** Egyptian Arabic, like every user-facing string — English skill names inside are fine ("خبرة Excel متقدمة"), an all-English line isn't. */
const arabicLine = () => z.string().trim().min(2).max(120).refine((line) => ARABIC_LETTER.test(line), 'must be Egyptian Arabic');

/**
 * The model sometimes glues two list items into one string with the JSON punctuation leaked inside
 * (`'خبرة Excel", "بكالوريوس تجارة'`) — split those back apart and strip stray quotes before each
 * line is validated on its own.
 */
const lines = () =>
  z.preprocess(
    (value) =>
      Array.isArray(value)
        ? value.flatMap((line) => (typeof line === 'string' ? line.split(/"\s*,\s*"/).map((part) => part.replace(/^[\s"]+|[\s"]+$/g, '')).filter(Boolean) : [line]))
        : value,
    z.array(arabicLine()),
  );

/** The model's reply envelope. Items are validated one by one (`jobMatchItemSchema`) so one bad item doesn't throw away the rest of the batch. */
export const jobMatchEnvelopeSchema = z.object({ matches: z.array(z.unknown()) });

export const jobMatchItemSchema = z.object({
  jobId: z.string().trim().min(1),
  // Models sometimes answer 85.0 or "85" — a number is a number.
  match: z.coerce.number().min(0).max(100).transform((value) => Math.round(value)),
  // Empty is a real verdict, not a malformed reply: for a job that plainly doesn't fit, the model
  // (correctly) has no reason to give. Rejecting it only re-asked the same question and kept the job
  // out of the cache. `modules/matching` never returns a job without a reason.
  whyMatch: lines().transform((items) => items.slice(0, 3)),
  gaps: lines().transform((items) => items.slice(0, 3)),
});
