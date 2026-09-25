import { CITIES_BY_COUNTRY } from './cities.js';

/**
 * A listing title without the gender tag German (and Austrian/Swiss) ads carry — "(m/w/d)",
 * "(m/f/d)", "(w/m/x)", "(gn)", "(all genders)" — which reads oddly inside an English sentence
 * and makes the same job look like two.
 */
export function withoutGenderTag(title: string): string {
  return title
    .replace(/\s*[([]\s*(?:[mwfdx](?:\s*[/|,]\s*[mwfdx]){1,3}|gn\*?|all genders?|div)\s*[)\]]/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Legal-form words that differ between postings of one employer ("msg systems" / "Msg Systems AG"). */
const LEGAL_FORMS = new Set(['gmbh', 'mbh', 'ag', 'se', 'kg', 'kgaa', 'ohg', 'ug', 'co', 'ltd', 'llc', 'inc', 'plc', 'sa', 'sae', 'corp', 'bv', 'nv']);

/** Place words a title may carry ("Machine Learning Engineer - Munich") — the city isn't part of what the job is. */
const PLACE_WORDS = new Set(
  [...Object.values(CITIES_BY_COUNTRY).flatMap((cities) => cities.flatMap((city) => city.aliases)), 'germany', 'deutschland', 'egypt', 'remote', 'homeoffice']
    .flatMap((name) => name.toLowerCase().split(/\s+/)),
);

function words(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .split(' ')
    .filter(Boolean);
}

/**
 * What makes two stored listings the same job posted twice — the same employer and the same title,
 * ignoring gender tags, legal forms, punctuation and any place name in the title. Null when there's
 * no company: two anonymous "Accountant" listings are not known to be one job.
 */
export function listingIdentity(job: { title: string; company: string | null }): string | null {
  const company = words(job.company ?? '').filter((word) => !LEGAL_FORMS.has(word)).join(' ');
  if (!company) {
    return null;
  }
  const title = words(withoutGenderTag(job.title)).filter((word) => !PLACE_WORDS.has(word)).join(' ');
  return `${company}|${title}`;
}
