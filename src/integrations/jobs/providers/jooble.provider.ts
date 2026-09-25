import { Logger } from '@nestjs/common';
import type { JobProvider, JobSearchQuery, JobSearchResult, ProviderJob } from '../job-provider.interface.js';

/**
 * Jooble is split per country: each country site has its own API endpoint AND its own key — a key
 * from jooble.org only ever returns US jobs, and asking it for location "Egypt" silently returns 0
 * (not an error). So every market needs a key registered on its own site (eg.jooble.org/api/about…).
 */
const JOOBLE_HOST_BY_COUNTRY: Record<string, string> = {
  EG: 'eg.jooble.org',
  SA: 'sa.jooble.org',
  AE: 'ae.jooble.org',
  DE: 'de.jooble.org',
};

interface JoobleJob {
  id: number | string;
  title: string;
  location: string;
  snippet: string;
  salary: string;
  source: string;
  type: string;
  link: string;
  company: string;
  updated: string;
}

interface JoobleResponse {
  totalCount: number;
  jobs: JoobleJob[];
}

/**
 * Talks to Jooble's REST API directly over fetch. Every call this makes is precious — Jooble's free
 * plan is a total LIFETIME limit of 500 requests per key (so per country), not a renewing quota —
 * so this class never decides when to call; it only knows how. `modules/jobs`'s ingestion service is the sole caller, and
 * it's the one enforcing the budget and logging every call (see `JobSearchCall`).
 */
export class JoobleProvider implements JobProvider {
  private readonly logger = new Logger(JoobleProvider.name);

  /** Country code → that country site's API key; a country without one is simply not searched. */
  constructor(private readonly apiKeys: Partial<Record<string, string>>) {}

  supportsCountry(country: string): boolean {
    return !!JOOBLE_HOST_BY_COUNTRY[country] && !!this.apiKeys[country];
  }

  async search(query: JobSearchQuery): Promise<JobSearchResult> {
    const host = JOOBLE_HOST_BY_COUNTRY[query.country];
    const apiKey = this.apiKeys[query.country];
    if (!host || !apiKey) {
      throw new Error(`No Jooble API key configured for country "${query.country}".`);
    }
    const response = await fetch(`https://${host}/api/${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        keywords: query.keywords,
        // The country site already scopes results to its country — no location means the whole country.
        location: '',
        page: query.page ?? 1,
        // Up to 100 per Jooble's own docs — maximizing this is how a 500-call lifetime budget
        // stretches to cover meaningfully many jobs instead of 500 calls of ~20 each.
        ResultOnPage: query.resultsPerPage ?? 100,
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`Jooble API error ${response.status}: ${body}`);
    }

    const data = (await response.json()) as JoobleResponse;
    this.logger.log(`keywords="${query.keywords}" host=${host} -> ${data.jobs?.length ?? 0}/${data.totalCount ?? '?'} jobs`);

    return {
      totalCount: data.totalCount ?? 0,
      jobs: (data.jobs ?? []).map(toProviderJob),
    };
  }
}

function toProviderJob(job: JoobleJob): ProviderJob {
  return {
    externalId: String(job.id),
    title: job.title,
    company: job.company || null,
    location: job.location || null,
    snippet: job.snippet || null,
    salary: job.salary || null,
    jobType: job.type || null,
    link: job.link,
    source: job.source || null,
    updatedAt: job.updated || null,
    raw: job as unknown as Record<string, unknown>,
  };
}
