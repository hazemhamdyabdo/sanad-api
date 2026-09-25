import { CITIES_BY_COUNTRY } from './cities.js';
import { TARGET_COUNTRIES, type TargetCountry } from './countries.js';

/**
 * A provider's "market" isn't the job's country: de.jooble.org also returns Austrian and
 * Luxembourg listings ("Österreich", "Luxembourg"), and a Germany search must not show them. This is
 * the deterministic check — the listing's own location text against place names, never a guess.
 *
 * Names are matched as whole words, lowercase. Deliberately only unambiguous ones: no "Linz"
 * (also a German town, Linz am Rhein) and no "Bern" (German place names contain it).
 */
const OTHER_COUNTRY_NAMES: string[][] = [
  ['austria', 'österreich', 'oesterreich', 'wien', 'vienna', 'graz', 'salzburg', 'innsbruck', 'klagenfurt', 'oberösterreich', 'niederösterreich', 'steiermark', 'tirol', 'kärnten', 'vorarlberg', 'burgenland'],
  ['switzerland', 'schweiz', 'suisse', 'svizzera', 'zürich', 'zurich', 'zuerich', 'basel', 'genf', 'geneva', 'genève', 'lausanne', 'luzern'],
  ['luxembourg', 'luxemburg'],
  ['netherlands', 'niederlande', 'nederland', 'amsterdam', 'rotterdam', 'eindhoven', 'utrecht'],
  ['belgium', 'belgien', 'belgique', 'brussels', 'brüssel', 'bruxelles', 'antwerpen'],
  ['france', 'frankreich', 'paris', 'strasbourg', 'straßburg'],
  ['poland', 'polen', 'warsaw', 'warschau', 'kraków', 'krakow'],
  ['czech republic', 'czechia', 'tschechien', 'prague', 'prag'],
  ['denmark', 'dänemark', 'copenhagen', 'kopenhagen'],
  ['united kingdom', 'london'],
  ['united states', 'usa'],
  ['qatar', 'قطر', 'doha', 'الدوحة'],
  ['kuwait', 'الكويت'],
  ['bahrain', 'البحرين'],
  ['oman', 'muscat', 'مسقط'],
  ['jordan', 'الأردن', 'amman'],
];

const OWN_NAMES: Record<TargetCountry, string[]> = {
  EG: ['egypt', 'ägypten', 'مصر'],
  SA: ['saudi arabia', 'ksa', 'saudi-arabien', 'السعودية'],
  AE: ['united arab emirates', 'uae', 'الإمارات'],
  DE: ['germany', 'deutschland', 'ألمانيا'],
};

/** Each target country's own names plus its known cities (cities.ts). */
function namesOf(country: TargetCountry): string[] {
  return [...OWN_NAMES[country], ...CITIES_BY_COUNTRY[country].flatMap((city) => city.aliases)];
}

function mentions(text: string, name: string): boolean {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^\\p{L}\\p{N}])${escaped}($|[^\\p{L}\\p{N}])`, 'u').test(text);
}

/**
 * False only when the listing's location names another country (or one of its cities/regions) and
 * not this market itself ("Remote, Deutschland oder Österreich" stays). An unknown town, an empty
 * location, or "Homeoffice" stays in the market it came from.
 */
export function isInMarket(market: TargetCountry, location: string | null): boolean {
  if (!location) {
    return true;
  }
  const text = location.toLowerCase();
  if (namesOf(market).some((name) => mentions(text, name))) {
    return true;
  }
  const others = [...OTHER_COUNTRY_NAMES, ...TARGET_COUNTRIES.filter((code) => code !== market).map(namesOf)];
  return !others.some((names) => names.some((name) => mentions(text, name)));
}
