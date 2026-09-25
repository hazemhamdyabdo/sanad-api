import type { JobProvider, JobSearchQuery, JobSearchResult } from '../job-provider.interface.js';
export declare class JoobleProvider implements JobProvider {
    private readonly apiKeys;
    private readonly logger;
    constructor(apiKeys: Partial<Record<string, string>>);
    supportsCountry(country: string): boolean;
    search(query: JobSearchQuery): Promise<JobSearchResult>;
}
