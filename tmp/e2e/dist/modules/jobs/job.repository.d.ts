import { Repository } from 'typeorm';
import type { EmploymentType, WorkType } from '../../common/types/contract.js';
import type { TargetCountry } from './countries.js';
import { Job } from './entities/job.entity.js';
import type { RoleGroupId } from './roles.js';
export interface UnenrichedJobRow {
    id: string;
    role: string;
    group: RoleGroupId;
    country: TargetCountry;
    title: string;
    location: string | null;
    snippet: string | null;
    jobType: string | null;
}
export interface JobEnrichment {
    workType: WorkType;
    employmentType: EmploymentType;
    city: string | null;
    embedding: number[];
    embeddingModel: string;
    embeddingTextHash: string;
}
export interface SimilarJobsFilter {
    countries: TargetCountry[] | null;
    workTypes: WorkType[];
    city: string | null;
    group: RoleGroupId | null;
}
export interface SimilarJobRow {
    id: string;
    similarity: number;
}
export declare class JobRepository {
    private readonly jobRepo;
    constructor(jobRepo: Repository<Job>);
    upsert(job: Omit<Job, 'id' | 'firstSeenAt' | 'lastSeenAt'>): Promise<void>;
    findUnenriched(embeddingModel: string, countries: TargetCountry[] | null, limit: number): Promise<UnenrichedJobRow[]>;
    saveEnrichment(id: string, enrichment: JobEnrichment): Promise<void>;
    searchByEmbedding(embedding: number[], embeddingModel: string, provider: string, filter: SimilarJobsFilter, limit: number): Promise<SimilarJobRow[]>;
    findByIds(ids: string[]): Promise<Job[]>;
}
