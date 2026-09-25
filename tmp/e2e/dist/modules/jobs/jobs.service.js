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
var JobsService_1;
import { createHash } from 'node:crypto';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EMBEDDING_PROVIDER } from '../../integrations/embeddings/embedding.interface.js';
import { JOOBLE_LOCATION_BY_COUNTRY } from './countries.js';
import { resolveApplyMethod } from './apply-method.js';
import { resolveCity } from './cities.js';
import { buildJobEmbeddingText } from './embedding-text.js';
import { deriveEmploymentType, deriveWorkType } from './job-facets.js';
import { JobRepository } from './job.repository.js';
import { RoleIngestionRepository } from './role-ingestion.repository.js';
import { getGroupById, getRoleByCode, normalize, resolveRoleFromCvTitle } from './roles.js';
const DAY_MS = 24 * 60 * 60 * 1000;
const ENRICH_BATCH_SIZE = 200;
let JobsService = JobsService_1 = class JobsService {
    roleIngestionRepository;
    jobRepository;
    configService;
    embeddings;
    logger = new Logger(JobsService_1.name);
    constructor(roleIngestionRepository, jobRepository, configService, embeddings) {
        this.roleIngestionRepository = roleIngestionRepository;
        this.jobRepository = jobRepository;
        this.configService = configService;
        this.embeddings = embeddings;
    }
    async matchRoleForCvTitle(title) {
        const role = resolveRoleFromCvTitle(title);
        if (!role && title?.trim()) {
            await this.roleIngestionRepository.recordUnmatchedTitle(normalize(title), title.trim());
            this.logger.log(`No curated role matched CV title "${title}" — logged for review.`);
        }
        return role;
    }
    async resolveTargetRole(headline, pastTitles) {
        const fromHeadline = await this.matchRoleForCvTitle(headline);
        if (fromHeadline) {
            return fromHeadline;
        }
        for (const title of pastTitles) {
            const role = resolveRoleFromCvTitle(title);
            if (role) {
                return role;
            }
        }
        return null;
    }
    async getIngestionStatus(group, country) {
        return (await this.roleIngestionRepository.findCache(group, country))?.status ?? null;
    }
    async ensureRoleIngested(roleCode, country) {
        const role = getRoleByCode(roleCode);
        if (!role) {
            throw new Error(`ensureRoleIngested: unknown role code "${roleCode}".`);
        }
        const existing = await this.roleIngestionRepository.findCache(role.group, country);
        if (!existing) {
            await this.roleIngestionRepository.createCache(role.group, country, 'pending');
            this.logger.log(`Queued role group "${role.group}" (${country}) for ingestion — never fetched before.`);
            return;
        }
        if (existing.status === 'pending') {
            return;
        }
        if (existing.status === 'fresh') {
            const ttlMs = this.configService.get('jobs.cacheTtlDays', 30) * DAY_MS;
            const age = existing.lastFetchedAt ? Date.now() - existing.lastFetchedAt.getTime() : Number.POSITIVE_INFINITY;
            const provider = this.configService.get('jobs.provider', 'fake');
            const fetchedByActiveProvider = await this.roleIngestionRepository.hasSucceededCall(provider, getGroupById(role.group).keywords, JOOBLE_LOCATION_BY_COUNTRY[country]);
            if (age < ttlMs && fetchedByActiveProvider) {
                return;
            }
        }
        existing.status = 'pending';
        await this.roleIngestionRepository.saveCache(existing);
        this.logger.log(`Re-queued role group "${role.group}" (${country}) for ingestion.`);
    }
    async upsertProviderJobs(jobs, role, country, provider) {
        for (const job of jobs) {
            const { method, email } = resolveApplyMethod(job.snippet);
            await this.jobRepository.upsert({
                provider,
                externalId: job.externalId,
                role: role.code,
                group: role.group,
                country,
                title: job.title,
                company: job.company,
                location: job.location,
                snippet: job.snippet,
                salary: job.salary,
                jobType: job.jobType,
                link: job.link,
                applyMethod: method,
                applyEmail: email,
                sourceUpdatedAt: job.updatedAt ? new Date(job.updatedAt) : null,
                ...this.deriveFacets({ role: role.code, country, title: job.title, location: job.location, snippet: job.snippet, jobType: job.jobType }),
                raw: job.raw,
            });
        }
        return jobs.length;
    }
    async enrichPendingJobs(countries = null) {
        let total = 0;
        while (true) {
            const rows = await this.jobRepository.findUnenriched(this.embeddings.model, countries, ENRICH_BATCH_SIZE);
            if (!rows.length) {
                return total;
            }
            const texts = rows.map((row) => buildJobEmbeddingText(row));
            const vectors = await this.embeddings.embed(texts);
            for (const [index, row] of rows.entries()) {
                await this.jobRepository.saveEnrichment(row.id, {
                    ...this.deriveFacets(row),
                    embedding: vectors[index],
                    embeddingModel: this.embeddings.model,
                    embeddingTextHash: createHash('sha256').update(texts[index]).digest('hex'),
                });
            }
            total += rows.length;
            this.logger.log(`Embedded ${rows.length} job(s) with ${this.embeddings.model}.`);
            if (rows.length < ENRICH_BATCH_SIZE) {
                return total;
            }
        }
    }
    searchSimilarJobs(embedding, filter, limit) {
        const provider = this.configService.get('jobs.provider', 'fake');
        return this.jobRepository.searchByEmbedding(embedding, this.embeddings.model, provider, filter, limit);
    }
    findJobsByIds(ids) {
        return this.jobRepository.findByIds(ids);
    }
    deriveFacets(job) {
        return {
            workType: deriveWorkType(job.title, job.snippet, job.location, job.jobType),
            employmentType: deriveEmploymentType(job.role, job.jobType, job.title, job.snippet),
            city: resolveCity(job.country, job.location),
        };
    }
};
JobsService = JobsService_1 = __decorate([
    Injectable(),
    __param(3, Inject(EMBEDDING_PROVIDER)),
    __metadata("design:paramtypes", [RoleIngestionRepository,
        JobRepository,
        ConfigService, Object])
], JobsService);
export { JobsService };
//# sourceMappingURL=jobs.service.js.map