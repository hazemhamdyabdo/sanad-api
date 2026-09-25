export interface JobSearchQuery {
  keywords: string;
  /** ISO country code of the market being searched (e.g. "EG") — some providers (Jooble) are split per country, with a separate endpoint and key for each. */
  country: string;
  /** The country's plain-English name (e.g. "Egypt"), for providers that take the location as free text. */
  location: string;
  page?: number;
  resultsPerPage?: number;
}

export interface ProviderJob {
  /** The provider's own id for this posting, stringified — the dedup key alongside the provider's name. */
  externalId: string;
  title: string;
  company: string | null;
  location: string | null;
  snippet: string | null;
  salary: string | null;
  jobType: string | null;
  link: string;
  /** The provider's own "source" field, if it has one (e.g. Jooble aggregates from other boards and reports which). Distinct from OUR `provider` name. */
  source: string | null;
  updatedAt: string | null;
  /** The exact object the provider returned for this job, kept for anything a typed field doesn't capture. */
  raw: Record<string, unknown>;
}

export interface JobSearchResult {
  jobs: ProviderJob[];
  totalCount: number;
}

/**
 * The port every business module depends on for job search. Same rule as every other integration in
 * this app: no vendor SDK or raw response outside integrations/ — swapping or adding a provider is a
 * one-file change in providers/ + job-provider.module.ts. `modules/jobs` never knows this is Jooble.
 */
export interface JobProvider {
  /** Whether this provider is configured to search this country at all — checked before any call, so an unconfigured market never spends (or logs) one. */
  supportsCountry(country: string): boolean;
  search(query: JobSearchQuery): Promise<JobSearchResult>;
}

export const JOB_PROVIDER = Symbol('JOB_PROVIDER');
