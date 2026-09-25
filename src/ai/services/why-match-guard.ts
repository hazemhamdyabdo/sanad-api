import type { MatchCandidate } from '../schemas/job-match.schema.js';

/**
 * The "never invent" rule for match reasons, enforced in code — same idea as CV tailoring's fact
 * guard. A `whyMatch` line claims something about the CANDIDATE, so every fact in it must be in the
 * candidate data the model was given; the model's habit is to lift requirements from the listing
 * ("voice pipeline (STT)", "Feature Engineering") and present them as the candidate's experience.
 *
 * What counts as a fact: every Latin-script term (skill, tool, degree, company, title — the prompt
 * keeps those in English, as written in the CV) and every number. The Arabic around them is
 * connective ("خبرة", "مهارات") and isn't checked. A line must carry at least one fact, and all of
 * its facts must trace back to the candidate; otherwise it's dropped — better three honest reasons
 * than five with two invented.
 */

/** English glue and generic praise — not claims about the candidate, so not checked. */
const NON_FACT_WORDS = new Set([
  'a', 'an', 'and', 'or', 'with', 'in', 'on', 'of', 'for', 'the', 'to', 'using', 'via', 'from', 'at', 'by', 'as', 'plus', 'including',
  'experience', 'experienced', 'skill', 'skills', 'knowledge', 'strong', 'solid', 'good', 'hands-on', 'background', 'proficiency', 'proficient',
  'advanced', 'expert', 'intermediate', 'basic', 'beginner', 'native', 'fluent', 'level', 'year', 'years',
]);

/** Plural and verb endings, so "LLMs" traces to "LLM" and "deployment" to "Deployed". */
const SUFFIXES = ['ations', 'ation', 'ments', 'ment', 'ings', 'ing', 'ers', 'er', 'ed', 'es', 's'];

const LATIN_TERM = /[a-z0-9][a-z0-9.+#-]*/g;

function stem(term: string): string {
  for (const suffix of SUFFIXES) {
    if (term.endsWith(suffix) && term.length - suffix.length >= 4) {
      return term.slice(0, -suffix.length);
    }
  }
  return term;
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Everything the explainer saw about the candidate, as one lowercase text. */
export function candidateFactsText(candidate: MatchCandidate): string {
  return JSON.stringify(candidate).toLowerCase();
}

function isTraced(term: string, facts: string, yearsOfExperience: number | null): boolean {
  if (/^\d+(\.\d+)?$/.test(term)) {
    return Number(term) === yearsOfExperience || new RegExp(`(^|[^0-9])${escapeRegExp(term)}($|[^0-9])`).test(facts);
  }
  const root = stem(term.replace(/[.-]+$/, ''));
  // Short terms ("ai", "ml", "sql") must stand alone — "ml" inside "html" is not ML experience.
  if (root.length <= 3) {
    return new RegExp(`(^|[^a-z0-9])${escapeRegExp(root)}($|[^a-z0-9])`).test(facts);
  }
  return facts.includes(root);
}

/** True when the line names at least one fact and every fact in it is in the candidate's data. */
export function isTraceableReason(line: string, facts: string, yearsOfExperience: number | null): boolean {
  const western = line.replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit))).toLowerCase();
  const terms = (western.match(LATIN_TERM) ?? [])
    // "AI/ML" and "NLP/LLM" are two claims each.
    .flatMap((term) => term.split('/'))
    .map((term) => term.replace(/[.,;:)]+$/, ''))
    .filter((term) => term && !NON_FACT_WORDS.has(term));
  return terms.length > 0 && terms.every((term) => isTraced(term, facts, yearsOfExperience));
}
