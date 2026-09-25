import { ConfigService } from '@nestjs/config';
import { type EmbeddingProvider } from '../../integrations/embeddings/embedding.interface.js';
import type { ProviderJob } from '../../integrations/jobs/job-provider.interface.js';
import { type TargetCountry } from './countries.js';
import type { Job } from './entities/job.entity.js';
import type { RoleIngestionStatus } from './entities/role-ingestion-cache.entity.js';
import { JobRepository, type SimilarJobRow, type SimilarJobsFilter } from './job.repository.js';
import { RoleIngestionRepository } from './role-ingestion.repository.js';
import { type RoleDefinition, type RoleGroupId } from './roles.js';
export declare class JobsService {
    private readonly roleIngestionRepository;
    private readonly jobRepository;
    private readonly configService;
    private readonly embeddings;
    private readonly logger;
    constructor(roleIngestionRepository: RoleIngestionRepository, jobRepository: JobRepository, configService: ConfigService, embeddings: EmbeddingProvider);
    matchRoleForCvTitle(title: string | null | undefined): Promise<RoleDefinition | null>;
    resolveTargetRole(headline: string | null, pastTitles: string[]): Promise<RoleDefinition | null>;
    getIngestionStatus(group: RoleGroupId, country: TargetCountry): Promise<RoleIngestionStatus | null>;
    ensureRoleIngested(roleCode: string, country: TargetCountry): Promise<void>;
    upsertProviderJobs(jobs: ProviderJob[], role: RoleDefinition, country: TargetCountry, provider: string): Promise<number>;
    enrichPendingJobs(countries?: TargetCountry[] | null): Promise<number>;
    searchSimilarJobs(embedding: number[], filter: SimilarJobsFilter, limit: number): Promise<SimilarJobRow[]>;
    findJobsByIds(ids: string[]): Promise<Job[]>;
    private deriveFacets;
}
