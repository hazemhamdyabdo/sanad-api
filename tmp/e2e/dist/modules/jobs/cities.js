export const CITIES_BY_COUNTRY = {
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
    DE: [
        { code: 'berlin', aliases: ['berlin'] },
        { code: 'munich', aliases: ['munich', 'münchen', 'muenchen', 'munchen'] },
        { code: 'hamburg', aliases: ['hamburg'] },
        { code: 'frankfurt', aliases: ['frankfurt', 'frankfurt am main', 'frankfurt main'] },
        { code: 'cologne', aliases: ['cologne', 'köln', 'koeln', 'koln'] },
    ],
};
function containsPhrase(haystack, phrase) {
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(^|[^\\p{L}\\p{N}])${escaped}($|[^\\p{L}\\p{N}])`, 'u').test(haystack);
}
export function countryOfLocation(location) {
    if (!location) {
        return null;
    }
    const text = location.toLowerCase();
    const entry = Object.entries(CITIES_BY_COUNTRY).find(([, cities]) => cities.some((city) => city.aliases.some((alias) => containsPhrase(text, alias))));
    return entry?.[0] ?? null;
}
export function resolveCity(country, location) {
    if (!location) {
        return null;
    }
    const text = location.toLowerCase();
    return CITIES_BY_COUNTRY[country].find((city) => city.aliases.some((alias) => containsPhrase(text, alias)))?.code ?? null;
}
//# sourceMappingURL=cities.js.map