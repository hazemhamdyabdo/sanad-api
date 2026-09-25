import { CITIES_BY_COUNTRY } from './cities.js';
import { inferSeniorityFromTitle, toPlainText } from './job-facets.js';
import { getRoleByCode } from './roles.js';
const MAX_DETAILS_CHARS = 1_200;
const COUNTRY_NAMES = ['egypt', 'saudi arabia', 'ksa', 'united arab emirates', 'uae', 'germany', 'deutschland', 'مصر', 'السعودية', 'الإمارات', 'ألمانيا'];
const LOCATION_WORDS = [...COUNTRY_NAMES, ...Object.values(CITIES_BY_COUNTRY).flatMap((cities) => cities.flatMap((city) => city.aliases))]
    .sort((a, b) => b.length - a.length);
function unique(values) {
    const seen = new Set();
    return values.filter((value) => {
        const key = value.trim().toLowerCase();
        if (!key || seen.has(key)) {
            return false;
        }
        seen.add(key);
        return true;
    });
}
export function groupLabel(group) {
    return group.replace(/_/g, ' ');
}
export function buildEmbeddingText(parts) {
    const lines = [`Title: ${unique(parts.titles).join(' / ')}`];
    if (parts.seniority) {
        lines.push(`Seniority: ${parts.seniority}`);
    }
    const skills = unique(parts.skills);
    if (skills.length) {
        lines.push(`Skills: ${skills.join(', ')}`);
    }
    const domains = unique(parts.domains);
    if (domains.length) {
        lines.push(`Domain: ${domains.join(', ')}`);
    }
    if (parts.details) {
        lines.push(`Details: ${parts.details.slice(0, MAX_DETAILS_CHARS)}`);
    }
    return lines.join('\n');
}
function stripLocations(text) {
    let result = text;
    for (const word of LOCATION_WORDS) {
        const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        result = result.replace(new RegExp(`(^|[^\\p{L}\\p{N}])${escaped}(?=$|[^\\p{L}\\p{N}])`, 'giu'), '$1');
    }
    return result.replace(/\s+([,.;:])/g, '$1').replace(/\s+/g, ' ').trim();
}
export function buildJobEmbeddingText(job) {
    const role = getRoleByCode(job.role);
    return buildEmbeddingText({
        titles: [stripLocations(job.title).replace(/[\s\-–—,|]+$/, ''), ...(role ? [role.labelEn] : [])],
        seniority: inferSeniorityFromTitle(job.title),
        skills: [],
        domains: [groupLabel(job.group)],
        details: stripLocations(toPlainText(job.snippet)),
    });
}
//# sourceMappingURL=embedding-text.js.map