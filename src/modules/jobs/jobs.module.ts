import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
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
 * No controller yet — nothing outside this module reads `Job` rows or triggers ingestion over HTTP.
 * `JobsService.ensureRoleIngested`/`matchRoleForCvTitle` are the module's public surface (see
 * `index.ts`), called for now only by the seed script; a CV-analysis/preferences-driven caller and a
 * jobs-read endpoint are later, separate work.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Job, RoleIngestionCache, JobSearchCall, UnmatchedRoleTitle]), JobProviderModule],
  providers: [JobsService, JobRepository, RoleIngestionRepository, JobIngestionService],
  // JobIngestionService is exported only so the seed script can trigger one sweep pass immediately
  // (see scripts/seed-job-roles.ts) — no controller or other module should call it directly;
  // `JobsService.ensureRoleIngested` plus the module's own interval is the real path.
  exports: [JobsService, JobIngestionService],
})
export class JobsModule {}
