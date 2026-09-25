import type { TargetCountry } from './countries.js';
export declare const CITIES_BY_COUNTRY: Record<TargetCountry, Array<{
    code: string;
    aliases: string[];
}>>;
export declare function resolveCity(country: TargetCountry, location: string | null): string | null;
