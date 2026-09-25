var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var JobIngestionService_1;
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { generateId } from '../../common/ids.js';
import { JOB_PROVIDER } from '../../integrations/jobs/job-provider.interface.js';
import { JOOBLE_LOCATION_BY_COUNTRY } from './countries.js';
import { JobsService } from './jobs.service.js';
import { RoleIngestionRepository } from './role-ingestion.repository.js';
import { getGroupById, ROLE_DEFINITIONS } from './roles.js';
const SWEEP_INTERVAL_MS = 5 * 1000;
const BATCH_SIZE = 5;
let JobIngestionService = JobIngestionService_1 = class JobIngestionService {
    roleIngestionRepository;
    jobsService;
    configService;
    provider;
    logger = new Logger(JobIngestionService_1.name);
    timer = null;
    sweeping = false;
    constructor(roleIngestionRepository, jobsService, configService, provider) {
        this.roleIngestionRepository = roleIngestionRepository;
        this.jobsService = jobsService;
        this.configService = configService;
        this.provider = provider;
    }
    onModuleInit() {
        this.timer = setInterval(() => {
            this.runSweepOnce().catch((error) => this.logger.error('Job ingestion sweep failed', error instanceof Error ? error.stack : error));
        }, SWEEP_INTERVAL_MS);
        this.timer.unref?.();
    }
    onModuleDestroy() {
        if (this.timer) {
            clearInterval(this.timer);
        }
    }
    async runSweepOnce() {
        if (this.sweeping) {
            return;
        }
        this.sweeping = true;
        try {
            await this.sweep();
        }
        finally {
            this.sweeping = false;
        }
    }
    async sweep() {
        const pending = await this.roleIngestionRepository.findPendingCache(BATCH_SIZE);
        for (const cache of pending) {
            if (!this.provider.supportsCountry(cache.country)) {
                cache.status = 'failed';
                cache.lastError = `Job provider not configured for ${cache.country}`;
                await this.roleIngestionRepository.saveCache(cache);
                this.logger.warn(`Group "${cache.group}" (${cache.country}) skipped — the job provider has no key for ${cache.country}. No call was made.`);
                continue;
            }
            if (!(await this.hasBudget(cache.country))) {
                cache.status = 'failed';
                cache.lastError = 'JOOBLE_MAX_CALLS reached — budget exhausted';
                await this.roleIngestionRepository.saveCache(cache);
                this.logger.error(`Job search budget exhausted for ${cache.country} — group "${cache.group}" left unfetched.`);
                continue;
            }
            await this.ingestGroup(cache);
        }
        if (pending.length) {
            await this.jobsService.enrichPendingJobs();
        }
    }
    async hasBudget(country) {
        const providerName = this.configService.get('jobs.provider', 'fake');
        const used = await this.roleIngestionRepository.countCalls(providerName, JOOBLE_LOCATION_BY_COUNTRY[country]);
        const max = this.configService.get('jobs.joobleMaxCalls', 450);
        return used < max;
    }
    async ingestGroup(cache) {
        const group = getGroupById(cache.group);
        const location = JOOBLE_LOCATION_BY_COUNTRY[cache.country];
        const providerName = this.configService.get('jobs.provider', 'fake');
        let allSucceeded = true;
        let lastError = null;
        for (const keyword of group.keywords) {
            if (!(await this.hasBudget(cache.country))) {
                allSucceeded = false;
                lastError = 'JOOBLE_MAX_CALLS reached mid-group';
                this.logger.error(`Job search budget exhausted mid-group "${cache.group}" (${cache.country}).`);
                break;
            }
            const role = ROLE_DEFINITIONS.find((definition) => definition.group === cache.group && definition.keyword === keyword);
            if (!role) {
                continue;
            }
            try {
                const result = await this.provider.search({ keywords: keyword, country: cache.country, location, resultsPerPage: 100 });
                await this.roleIngestionRepository.recordCall({
                    id: generateId('jsc'),
                    provider: providerName,
                    keywords: keyword,
                    location,
                    page: 1,
                    succeeded: true,
                    jobsReturned: result.jobs.length,
                    totalCount: result.totalCount,
                    errorMessage: null,
                });
                const written = await this.jobsService.upsertProviderJobs(result.jobs, role, cache.country, providerName);
                this.logger.log(`Ingested "${keyword}" (${cache.country}): ${written} job(s).`);
            }
            catch (error) {
                allSucceeded = false;
                lastError = error instanceof Error ? error.message : String(error);
                await this.roleIngestionRepository.recordCall({
                    id: generateId('jsc'),
                    provider: providerName,
                    keywords: keyword,
                    location,
                    page: 1,
                    succeeded: false,
                    jobsReturned: null,
                    totalCount: null,
                    errorMessage: lastError,
                });
                this.logger.error(`Job search call failed for "${keyword}" (${cache.country}): ${lastError}`);
            }
        }
        cache.status = allSucceeded ? 'fresh' : 'failed';
        if (allSucceeded) {
            cache.lastFetchedAt = new Date();
        }
        cache.lastError = lastError;
        await this.roleIngestionRepository.saveCache(cache);
    }
};
JobIngestionService = JobIngestionService_1 = __decorate([
    Injectable(),
    __param(3, Inject(JOB_PROVIDER)),
    __metadata("design:paramtypes", [RoleIngestionRepository,
        JobsService,
        ConfigService, Object])
], JobIngestionService);
export { JobIngestionService };
//# sourceMappingURL=job-ingestion.service.js.map