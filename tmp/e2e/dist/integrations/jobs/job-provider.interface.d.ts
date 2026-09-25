export interface JobSearchQuery {
    keywords: string;
    country: string;
    location: string;
    page?: number;
    resultsPerPage?: number;
}
export interface ProviderJob {
    externalId: string;
    title: string;
    company: string | null;
    location: string | null;
    snippet: string | null;
    salary: string | null;
    jobType: string | null;
    link: string;
    source: string | null;
    updatedAt: string | null;
    raw: Record<string, unknown>;
}
export interface JobSearchResult {
    jobs: ProviderJob[];
    totalCount: number;
}
export interface JobProvider {
    supportsCountry(country: string): boolean;
    search(query: JobSearchQuery): Promise<JobSearchResult>;
}
export declare const JOB_PROVIDER: unique symbol;
