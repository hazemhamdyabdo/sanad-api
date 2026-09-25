import { type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CvTailorService } from '../../ai/index.js';
import type { ApplicationStatus } from '../../common/types/contract.js';
import { type EmailProvider } from '../../integrations/email/email.interface.js';
import { CvService } from '../cv/index.js';
import { JobsService } from '../jobs/index.js';
import { ApplicationsRepository } from './applications.repository.js';
import { type ApplicationBatchDto, type ApplicationDto } from './dto/application-response.dto.js';
export declare class ApplicationsService implements OnModuleInit, OnModuleDestroy {
    private readonly repository;
    private readonly cvService;
    private readonly jobsService;
    private readonly cvTailorService;
    private readonly configService;
    private readonly email;
    private readonly logger;
    private readonly active;
    private timer;
    constructor(repository: ApplicationsRepository, cvService: CvService, jobsService: JobsService, cvTailorService: CvTailorService, configService: ConfigService, email: EmailProvider);
    onModuleInit(): void;
    onModuleDestroy(): void;
    create(deviceId: string, jobIds: string[]): Promise<ApplicationBatchDto>;
    getBatch(deviceId: string, batchId: string): Promise<ApplicationBatchDto>;
    list(deviceId: string): Promise<{
        applications: ApplicationDto[];
    }>;
    markOpened(deviceId: string, id: string): Promise<ApplicationDto>;
    getCvPdf(deviceId: string, id: string): Promise<{
        file: Buffer;
        filename: string;
    }>;
    findForJobs(deviceId: string, jobIds: string[]): Promise<Map<string, {
        id: string;
        status: ApplicationStatus;
    }>>;
    private processBatch;
    private processApplication;
    private send;
    private fail;
    private resumeStale;
}
