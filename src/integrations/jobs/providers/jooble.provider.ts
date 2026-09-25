import { Logger } from '@nestjs/common';
import type { JobProvider, JobSearchQuery, JobSearchResult, ProviderJob } from '../job-provider.interface.js';

const JOOBLE_API_BASE = 'https://jooble.org/api';

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
 * plan is a total LIFETIME limit of 500 requests per key, not a renewing quota — so this class never
 * decides when to call; it only knows how. `modules/jobs`'s ingestion service is the sole caller, and
 * it's the one enforcing the budget and logging every call (see `JobSearchCall`).
 */
export class JoobleProvider implements JobProvider {
  private readonly logger = new Logger(JoobleProvider.name);

  constructor(private readonly apiKey: string) {}

  async search(query: JobSearchQuery): Promise<JobSearchResult> {
    const response = await fetch(`${JOOBLE_API_BASE}/${this.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        keywords: query.keywords,
        location: query.location,
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
    this.logger.log(`keywords="${query.keywords}" location="${query.location}" -> ${data.jobs?.length ?? 0}/${data.totalCount ?? '?'} jobs`);

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
