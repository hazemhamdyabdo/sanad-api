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
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { generateId } from '../../common/ids.js';
import { Job } from './entities/job.entity.js';
function toVectorLiteral(vector) {
    return `[${vector.join(',')}]`;
}
let JobRepository = class JobRepository {
    jobRepo;
    constructor(jobRepo) {
        this.jobRepo = jobRepo;
    }
    async upsert(job) {
        const existing = await this.jobRepo.findOneBy({ provider: job.provider, externalId: job.externalId });
        if (existing) {
            const textChanged = existing.title !== job.title || existing.snippet !== job.snippet || existing.role !== job.role;
            await this.jobRepo.save(Object.assign(existing, job));
            if (textChanged) {
                await this.jobRepo.query(`UPDATE "jobs" SET "embedding" = NULL, "embeddingTextHash" = NULL WHERE "id" = $1`, [existing.id]);
            }
        }
        else {
            await this.jobRepo.save({ id: generateId('job'), ...job });
        }
    }
    async findUnenriched(embeddingModel, countries, limit) {
        const rows = await this.jobRepo.query(`SELECT "id", "role", "group", "country", "title", "location", "snippet", "jobType"
         FROM "jobs"
        WHERE ("embedding" IS NULL OR "embeddingModel" IS DISTINCT FROM $1 OR "workType" IS NULL)
          AND ($2::varchar[] IS NULL OR "country" = ANY($2))
        ORDER BY "firstSeenAt" ASC
        LIMIT $3`, [embeddingModel, countries, limit]);
        return rows.map((row) => ({
            id: row.id,
            role: row.role,
            group: row.group,
            country: row.country,
            title: row.title,
            location: row.location,
            snippet: row.snippet,
            jobType: row.jobType,
        }));
    }
    async saveEnrichment(id, enrichment) {
        await this.jobRepo.query(`UPDATE "jobs"
          SET "workType" = $2, "employmentType" = $3, "city" = $4,
              "embedding" = $5::vector, "embeddingModel" = $6, "embeddingTextHash" = $7
        WHERE "id" = $1`, [id, enrichment.workType, enrichment.employmentType, enrichment.city, toVectorLiteral(enrichment.embedding), enrichment.embeddingModel, enrichment.embeddingTextHash]);
    }
    async searchByEmbedding(embedding, embeddingModel, provider, filter, limit) {
        return this.jobRepo.manager.transaction(async (manager) => {
            await manager.query(`SET LOCAL hnsw.iterative_scan = strict_order`);
            const rows = await manager.query(`SELECT "id", 1 - ("embedding" <=> $1::vector) AS "similarity"
           FROM "jobs"
          WHERE "embedding" IS NOT NULL
            AND "embeddingModel" = $2
            AND ($3::varchar[] IS NULL OR "country" = ANY($3))
            AND "workType" = ANY($4::varchar[])
            AND ($5::varchar IS NULL OR "city" IS NULL OR "city" = $5)
            AND ($6::varchar IS NULL OR "group" = $6)
            AND "provider" = $7
          ORDER BY "embedding" <=> $1::vector
          LIMIT $8`, [toVectorLiteral(embedding), embeddingModel, filter.countries, filter.workTypes, filter.city, filter.group, provider, limit]);
            return rows.map((row) => ({ id: row.id, similarity: Number(row.similarity) }));
        });
    }
    findByIds(ids) {
        return ids.length ? this.jobRepo.findBy({ id: In(ids) }) : Promise.resolve([]);
    }
};
JobRepository = __decorate([
    Injectable(),
    __param(0, InjectRepository(Job)),
    __metadata("design:paramtypes", [Repository])
], JobRepository);
export { JobRepository };
//# sourceMappingURL=job.repository.js.map