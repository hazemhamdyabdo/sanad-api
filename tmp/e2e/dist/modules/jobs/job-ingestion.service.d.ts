import { type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { type JobProvider } from '../../integrations/jobs/job-provider.interface.js';
import { JobsService } from './jobs.service.js';
import { RoleIngestionRepository } from './role-ingestion.repository.js';
export declare class JobIngestionService implements OnModuleInit, OnModuleDestroy {
    private readonly roleIngestionRepository;
    private readonly jobsService;
    private readonly configService;
    private readonly provider;
    private readonly logger;
    private timer;
    constructor(roleIngestionRepository: RoleIngestionRepository, jobsService: JobsService, configService: ConfigService, provider: JobProvider);
    onModuleInit(): void;
    onModuleDestroy(): void;
    runSweepOnce(): Promise<void>;
    private hasBudget;
    private ingestGroup;
}
