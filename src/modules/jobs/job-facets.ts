import type { EmploymentType, Seniority, WorkType } from '../../common/types/contract.js';

/**
 * Deterministic facets derived from a listing's free text — the same "scan the text, never guess
 * the other way" approach as `resolveApplyMethod`. Aggregators like Jooble have no structured
 * work-type or seniority field, so these read the title/snippet/location/type strings. Anything
 * not explicitly signalled falls back to the most common case (on-site, full-time, seniority
 * unknown) rather than being inferred.
 */

// English, Arabic and German — DE listings are often in German ("Hybrides Arbeiten", "Homeoffice",
// "Teilzeit", "Schichtdienst"). German "Homeoffice" usually means some days at home, so it counts as
// hybrid unless the listing says fully remote.
const FULLY_REMOTE_PATTERN = /fully remote|full[\s-]remote|remote[\s-]first|100\s?% (remote|home[\s-]?office)|vollständig remote/i;
const REMOTE_PATTERN = /\bremote\b|work from home|\bwfh\b|عن بعد|من البيت|من المنزل/i;
const HYBRID_PATTERN = /\bhybrid|home[\s-]?office|mobiles arbeiten|هجين/i;
const PART_TIME_PATTERN = /part[\s-]?time|teilzeit|werkstudent|minijob|دوام جزئي|بارت تايم/i;
const SHIFTS_PATTERN = /\bshifts?\b|night shift|rotating|\bschicht|شيفت|ورديات/i;
const FIELD_PATTERN = /\bfield\b|on the road|outdoor|au(ß|ss)endienst|ميداني/i;
/** Roles that are field work by nature, whatever the listing says. */
const FIELD_ROLES = new Set(['driver', 'delivery_rider']);

const JUNIOR_PATTERN = /\b(intern|internship|trainee|junior|jr|entry[\s-]level|graduate|fresh|praktikum|praktikant(in)?|werkstudent(in)?|berufseinsteiger(in)?|absolvent(in)?)\b/i;
const SENIOR_PATTERN = /\b(senior|sr|lead|principal|head|manager|supervisor|director|chief|leiter(in)?|teamleiter(in)?|leitung)\b/i;

export function deriveWorkType(...texts: Array<string | null>): WorkType {
  const text = texts.filter(Boolean).join(' \n ');
  if (FULLY_REMOTE_PATTERN.test(text)) {
    return 'remote';
  }
  if (HYBRID_PATTERN.test(text)) {
    return 'hybrid';
  }
  if (REMOTE_PATTERN.test(text)) {
    return 'remote';
  }
  return 'on_site';
}

export function deriveEmploymentType(roleCode: string, jobType: string | null, ...texts: Array<string | null>): EmploymentType {
  const text = [jobType, ...texts].filter(Boolean).join(' \n ');
  if (PART_TIME_PATTERN.test(jobType ?? '') || PART_TIME_PATTERN.test(text)) {
    return 'part_time';
  }
  if (SHIFTS_PATTERN.test(text)) {
    return 'shifts';
  }
  if (FIELD_ROLES.has(roleCode) || FIELD_PATTERN.test(text)) {
    return 'field';
  }
  return 'full_time';
}

/** From the title only — a snippet's "reports to the senior manager" must not make a junior role senior. `null` when the title doesn't say. */
export function inferSeniorityFromTitle(title: string): Seniority | null {
  if (JUNIOR_PATTERN.test(title)) {
    return 'junior';
  }
  if (SENIOR_PATTERN.test(title)) {
    return 'senior';
  }
  return null;
}

/** Provider snippets arrive with HTML tags and entities (Jooble bolds the search terms) — plain text for embedding and the LLM. */
export function toPlainText(html: string | null): string {
  if (!html) {
    return '';
  }
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}
