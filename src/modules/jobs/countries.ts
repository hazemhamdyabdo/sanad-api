/** The three markets this app targets — see AGENTS.md/decisions. Not (yet) part of API-CONTRACT.md since no endpoint exposes it. */
export const TARGET_COUNTRIES = ['EG', 'SA', 'AE'] as const;
export type TargetCountry = (typeof TARGET_COUNTRIES)[number];

/** The exact string Jooble expects in its `location` field for each target country — a provider-specific detail kept out of the rest of the app, which only ever deals with the country code. */
export const JOOBLE_LOCATION_BY_COUNTRY: Record<TargetCountry, string> = {
  EG: 'Egypt',
  SA: 'Saudi Arabia',
  AE: 'United Arab Emirates',
};
