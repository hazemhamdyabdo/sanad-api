import type { JobProvider, JobSearchQuery, JobSearchResult, ProviderJob } from '../job-provider.interface.js';

let counter = 0;

/** No network calls, no cost — the default so nothing can accidentally spend real Jooble budget in dev/testing. Returns a handful of canned, schema-shaped jobs derived from the query itself. */
export class FakeJobProvider implements JobProvider {
  search(query: JobSearchQuery): Promise<JobSearchResult> {
    const jobs: ProviderJob[] = Array.from({ length: 3 }, (_, i) => {
      const id = `fake-${++counter}`;
      const isEmailApply = i === 1; // one of the three exercises the email-detection path
      const snippet = isEmailApply
        ? `We're hiring a ${query.keywords} in ${query.location}. Send your CV to hiring@example.com to apply.`
        : `Great opportunity for a ${query.keywords} in ${query.location}. Apply through the link below.`;

      return {
        externalId: id,
        title: `${query.keywords} (fake)`,
        company: 'Fake Co',
        location: query.location,
        snippet,
        salary: null,
        jobType: 'Full-time',
        link: `https://example.com/jobs/${id}`,
        source: 'fake',
        updatedAt: new Date().toISOString(),
        raw: { id, title: `${query.keywords} (fake)`, fake: true },
      };
    });

    return Promise.resolve({ jobs, totalCount: jobs.length });
  }
}
