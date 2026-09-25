import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmbeddingModule } from '../../integrations/embeddings/embedding.module.js';
import { JobProviderModule } from '../../integrations/jobs/job-provider.module.js';
import { Job } from './entities/job.entity.js';
import { JobSearchCall } from './entities/job-search-call.entity.js';
import { RoleIngestionCache } from './entities/role-ingestion-cache.entity.js';
import { UnmatchedRoleTitle } from './entities/unmatched-role-title.entity.js';
import { JobIngestionService } from './job-ingestion.service.js';
import { JobRepository } from './job.repository.js';
import { JobsService } from './jobs.service.js';
import { RoleIngestionRepository } from './role-ingestion.repository.js';

/**
 * No controller — job matching (`modules/matching`) is the HTTP surface for jobs, and reaches this
 * module only through `JobsService` (see `index.ts`): demand-driven ingestion
 * (`ensureRoleIngested`), embedding/enrichment, and the pgvector search itself.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Job, RoleIngestionCache, JobSearchCall, UnmatchedRoleTitle]), JobProviderModule, EmbeddingModule],
  providers: [JobsService, JobRepository, RoleIngestionRepository, JobIngestionService],
  // JobIngestionService is exported only so the seed script can trigger one sweep pass immediately
  // (see scripts/seed-job-roles.ts) — no controller or other module should call it directly;
  // `JobsService.ensureRoleIngested` plus the module's own interval is the real path.
  exports: [JobsService, JobIngestionService],
})
export class JobsModule {}
