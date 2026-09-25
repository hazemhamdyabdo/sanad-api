export interface JobSearchQuery {
  keywords: string;
  /** The provider's own expected location string (e.g. Jooble wants a country/city name) — translating our `TargetCountry` code into that is the provider's job, not the caller's. */
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
  search(query: JobSearchQuery): Promise<JobSearchResult>;
}

export const JOB_PROVIDER = Symbol('JOB_PROVIDER');
