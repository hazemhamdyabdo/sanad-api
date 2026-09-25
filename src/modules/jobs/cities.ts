import type { TargetCountry } from './countries.js';

/**
 * The cities a job-preferences `city` can name, per target country — lowercase codes on the wire
 * (API-CONTRACT.md §6), the app owns the Arabic labels. `aliases` are the free-text forms a
 * provider's `location` string uses for that city (English and Arabic, districts included), matched
 * as whole words after lowercasing. A listing matching none of them is left with `city: null`,
 * which the city filter treats as "flexible", never as a mismatch.
 */
export const CITIES_BY_COUNTRY: Record<TargetCountry, Array<{ code: string; aliases: string[] }>> = {
  EG: [
    { code: 'cairo', aliases: ['cairo', 'new cairo', 'nasr city', 'heliopolis', 'maadi', 'new capital', 'القاهرة'] },
    { code: 'giza', aliases: ['giza', '6th of october', 'october city', 'sheikh zayed', 'الجيزة'] },
    { code: 'alexandria', aliases: ['alexandria', 'alex', 'الإسكندرية', 'الاسكندرية'] },
  ],
  SA: [
    { code: 'riyadh', aliases: ['riyadh', 'الرياض'] },
    { code: 'jeddah', aliases: ['jeddah', 'jiddah', 'جدة'] },
    { code: 'dammam', aliases: ['dammam', 'الدمام'] },
  ],
  AE: [
    { code: 'dubai', aliases: ['dubai', 'دبي'] },
    { code: 'abu_dhabi', aliases: ['abu dhabi', 'أبوظبي', 'ابوظبي'] },
    { code: 'sharjah', aliases: ['sharjah', 'الشارقة'] },
  ],
  // German listings name the city in German ("München", "Köln", "Frankfurt am Main"), often with the
  // umlaut spelled out ("Muenchen") — all of those, plus the English names.
  DE: [
    { code: 'berlin', aliases: ['berlin'] },
    { code: 'munich', aliases: ['munich', 'münchen', 'muenchen', 'munchen'] },
    { code: 'hamburg', aliases: ['hamburg'] },
    { code: 'frankfurt', aliases: ['frankfurt', 'frankfurt am main', 'frankfurt main'] },
    { code: 'cologne', aliases: ['cologne', 'köln', 'koeln', 'koln'] },
  ],
};

function containsPhrase(haystack: string, phrase: string): boolean {
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^\\p{L}\\p{N}])${escaped}($|[^\\p{L}\\p{N}])`, 'u').test(haystack);
}

/** The target country a free-text location is in, by its known city names — null when it names none. */
export function countryOfLocation(location: string | null | undefined): TargetCountry | null {
  if (!location) {
    return null;
  }
  const text = location.toLowerCase();
  const entry = Object.entries(CITIES_BY_COUNTRY).find(([, cities]) => cities.some((city) => city.aliases.some((alias) => containsPhrase(text, alias))));
  return (entry?.[0] as TargetCountry | undefined) ?? null;
}

/** First city whose alias appears in the listing's location text, or null. Deterministic — never a guess. */
export function resolveCity(country: TargetCountry, location: string | null): string | null {
  if (!location) {
    return null;
  }
  const text = location.toLowerCase();
  return CITIES_BY_COUNTRY[country].find((city) => city.aliases.some((alias) => containsPhrase(text, alias)))?.code ?? null;
}
