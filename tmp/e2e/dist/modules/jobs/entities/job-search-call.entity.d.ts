export declare class JobSearchCall {
    id: string;
    provider: string;
    keywords: string;
    location: string;
    page: number;
    succeeded: boolean;
    jobsReturned: number | null;
    totalCount: number | null;
    errorMessage: string | null;
    requestedAt: Date;
}
