/** The markets this app sources jobs for — see AGENTS.md/decisions. Any other preferences country gets an empty list (API-CONTRACT.md §6). */
export const TARGET_COUNTRIES = ['EG', 'SA', 'AE', 'DE'] as const;
export type TargetCountry = (typeof TARGET_COUNTRIES)[number];

/** The country's English name, as a foreign employer reads it on a CV ("Nasr City, Cairo, Egypt"). */
export const COUNTRY_NAME_EN: Record<TargetCountry, string> = {
  EG: 'Egypt',
  SA: 'Saudi Arabia',
  AE: 'United Arab Emirates',
  DE: 'Germany',
};

/** The exact string Jooble expects in its `location` field for each target country — a provider-specific detail kept out of the rest of the app, which only ever deals with the country code. */
export const JOOBLE_LOCATION_BY_COUNTRY: Record<TargetCountry, string> = {
  EG: 'Egypt',
  SA: 'Saudi Arabia',
  AE: 'United Arab Emirates',
  DE: 'Germany',
};
