import { createHash } from 'node:crypto';
import { buildEmbeddingText, groupLabel } from '../jobs/index.js';
const MONTH_MS = 30.44 * 24 * 60 * 60 * 1000;
const MAX_HIGHLIGHTS = 12;
function str(entry, key) {
    if (entry && typeof entry === 'object' && key in entry) {
        const value = entry[key];
        return typeof value === 'string' && value.trim() ? value.trim() : null;
    }
    return null;
}
function strings(entries, format) {
    return entries.map(format).filter((value) => value !== null);
}
function parseCvDate(value, isEnd) {
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
function yearsFromExperience(experience) {
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
    return counted ? Math.round(months / 12) : null;
}
function seniorityFromYears(years, hasExperience) {
    if (!hasExperience || years === null || years < 2) {
        return 'junior';
    }
    return years < 5 ? 'mid' : 'senior';
}
function sameName(a, b) {
    return !!a && !!b && a.trim().toLowerCase() === b.trim().toLowerCase();
}
export function buildMatchCandidate(cv, analysis) {
    const usableAnalysis = analysis && (!cv || !cv.name || sameName(cv.name, analysis.cv.basic.name)) ? analysis : null;
    const source = cv ??
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
    const bullets = (entry) => {
        const value = entry && typeof entry === 'object' ? entry.bullets : null;
        return Array.isArray(value) ? value.filter((bullet) => typeof bullet === 'string' && !!bullet.trim()) : [];
    };
    const highlights = [
        ...source.experience.flatMap(bullets),
        ...source.projects.flatMap((project) => [str(project, 'title'), str(project, 'description'), ...bullets(project)].filter((line) => !!line)),
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
export function buildCandidateEmbeddingText(candidate, targetRole) {
    return buildEmbeddingText({
        titles: [...(candidate.title ? [candidate.title] : []), ...(targetRole ? [targetRole.labelEn] : []), ...candidate.pastTitles],
        seniority: candidate.seniority,
        skills: candidate.skills,
        domains: [...(targetRole ? [groupLabel(targetRole.group)] : []), ...candidate.domains],
    });
}
export function hashCandidate(candidate, promptVersion) {
    return createHash('sha256').update(JSON.stringify({ candidate, promptVersion })).digest('hex');
}
//# sourceMappingURL=candidate-profile.js.map