import type { JobProvider, JobSearchQuery, JobSearchResult } from '../job-provider.interface.js';
export declare class FakeJobProvider implements JobProvider {
    supportsCountry(): boolean;
    search(query: JobSearchQuery): Promise<JobSearchResult>;
}
