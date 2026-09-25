var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
let JobsModule = class JobsModule {
};
JobsModule = __decorate([
    Module({
        imports: [TypeOrmModule.forFeature([Job, RoleIngestionCache, JobSearchCall, UnmatchedRoleTitle]), JobProviderModule, EmbeddingModule],
        providers: [JobsService, JobRepository, RoleIngestionRepository, JobIngestionService],
        exports: [JobsService, JobIngestionService],
    })
], JobsModule);
export { JobsModule };
//# sourceMappingURL=jobs.module.js.map