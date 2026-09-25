const FULLY_REMOTE_PATTERN = /fully remote|full[\s-]remote|remote[\s-]first|100\s?% (remote|home[\s-]?office)|vollständig remote/i;
const REMOTE_PATTERN = /\bremote\b|work from home|\bwfh\b|عن بعد|من البيت|من المنزل/i;
const HYBRID_PATTERN = /\bhybrid|home[\s-]?office|mobiles arbeiten|هجين/i;
const PART_TIME_PATTERN = /part[\s-]?time|teilzeit|werkstudent|minijob|دوام جزئي|بارت تايم/i;
const SHIFTS_PATTERN = /\bshifts?\b|night shift|rotating|\bschicht|شيفت|ورديات/i;
const FIELD_PATTERN = /\bfield\b|on the road|outdoor|au(ß|ss)endienst|ميداني/i;
const FIELD_ROLES = new Set(['driver', 'delivery_rider']);
const JUNIOR_PATTERN = /\b(intern|internship|trainee|junior|jr|entry[\s-]level|graduate|fresh|praktikum|praktikant(in)?|werkstudent(in)?|berufseinsteiger(in)?|absolvent(in)?)\b/i;
const SENIOR_PATTERN = /\b(senior|sr|lead|principal|head|manager|supervisor|director|chief|leiter(in)?|teamleiter(in)?|leitung)\b/i;
export function deriveWorkType(...texts) {
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
export function deriveEmploymentType(roleCode, jobType, ...texts) {
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
export function inferSeniorityFromTitle(title) {
    if (JUNIOR_PATTERN.test(title)) {
        return 'junior';
    }
    if (SENIOR_PATTERN.test(title)) {
        return 'senior';
    }
    return null;
}
export function toPlainText(html) {
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
//# sourceMappingURL=job-facets.js.map