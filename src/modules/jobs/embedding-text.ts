import type { Seniority } from '../../common/types/contract.js';
import { CITIES_BY_COUNTRY } from './cities.js';
import { inferSeniorityFromTitle, toPlainText } from './job-facets.js';
import { getRoleByCode, type RoleDefinition, type RoleGroupId } from './roles.js';

/**
 * What goes into an embedding — only what determines fit: titles, seniority, skills, domain.
 * Location, country and work type are deliberately left out: they're hard filters applied in SQL
 * before the vector search, and letting them into the vector would make "a Cairo cook" look closer
 * to "a Cairo accountant" than to "a Giza cook".
 *
 * Jobs and CVs go through this one builder so both sides of the cosine distance share one layout.
 */
export interface EmbeddingTextParts {
  titles: string[];
  seniority: Seniority | null;
  skills: string[];
  domains: string[];
  /** Free text that carries skills/duties when there's no structured skill list (a job's description). */
  details?: string;
}

const MAX_DETAILS_CHARS = 1_200;

const COUNTRY_NAMES = ['egypt', 'saudi arabia', 'ksa', 'united arab emirates', 'uae', 'germany', 'deutschland', 'مصر', 'السعودية', 'الإمارات', 'ألمانيا'];
const LOCATION_WORDS = [...COUNTRY_NAMES, ...Object.values(CITIES_BY_COUNTRY).flatMap((cities) => cities.flatMap((city) => city.aliases))]
  // Longest first, so "new cairo" is removed whole before "cairo" would leave "new" behind.
  .sort((a, b) => b.length - a.length);

function unique(values: string[]): string[] {
  const seen = new Set<string>();
  return values.filter((value) => {
    const key = value.trim().toLowerCase();
    if (!key || seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

export function groupLabel(group: RoleGroupId): string {
  return group.replace(/_/g, ' ');
}

export function buildEmbeddingText(parts: EmbeddingTextParts): string {
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

/** A description with every known country/city name taken out — see the module comment for why location must not reach the vector. */
function stripLocations(text: string): string {
  let result = text;
  for (const word of LOCATION_WORDS) {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    result = result.replace(new RegExp(`(^|[^\\p{L}\\p{N}])${escaped}(?=$|[^\\p{L}\\p{N}])`, 'giu'), '$1');
  }
  return result.replace(/\s+([,.;:])/g, '$1').replace(/\s+/g, ' ').trim();
}

export function buildJobEmbeddingText(job: { title: string; role: string; group: RoleGroupId; snippet: string | null }): string {
  const role: RoleDefinition | undefined = getRoleByCode(job.role);
  return buildEmbeddingText({
    // Listing titles often carry the place too ("Accountant – Nasr City").
    titles: [stripLocations(job.title).replace(/[\s\-–—,|]+$/, ''), ...(role ? [role.labelEn] : [])],
    seniority: inferSeniorityFromTitle(job.title),
    skills: [],
    domains: [groupLabel(job.group)],
    details: stripLocations(toPlainText(job.snippet)),
  });
}
