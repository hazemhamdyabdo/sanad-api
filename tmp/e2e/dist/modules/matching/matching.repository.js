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
import { In, Not, Repository } from 'typeorm';
import { generateId } from '../../common/ids.js';
import { JobMatchExplanationRow } from './entities/job-match-explanation.entity.js';
import { JobMatchProfile } from './entities/job-match-profile.entity.js';
let MatchingRepository = class MatchingRepository {
    profileRepo;
    explanationRepo;
    constructor(profileRepo, explanationRepo) {
        this.profileRepo = profileRepo;
        this.explanationRepo = explanationRepo;
    }
    async findProfile(deviceId) {
        const rows = await this.profileRepo.query(`SELECT "profileHash", "embeddingModel", "embedding"::text AS "embedding" FROM "job_match_profiles" WHERE "deviceId" = $1`, [deviceId]);
        const row = rows[0];
        if (!row) {
            return null;
        }
        return { profileHash: row.profileHash, embeddingModel: row.embeddingModel, embedding: JSON.parse(row.embedding) };
    }
    async replaceProfile(deviceId, profile) {
        await this.profileRepo.manager.transaction(async (manager) => {
            await manager.query(`INSERT INTO "job_match_profiles" ("deviceId", "profileHash", "embeddingModel", "embedding", "updatedAt")
         VALUES ($1, $2, $3, $4::vector, now())
         ON CONFLICT ("deviceId") DO UPDATE
           SET "profileHash" = EXCLUDED."profileHash", "embeddingModel" = EXCLUDED."embeddingModel",
               "embedding" = EXCLUDED."embedding", "updatedAt" = now()`, [deviceId, profile.profileHash, profile.embeddingModel, `[${profile.embedding.join(',')}]`]);
            await manager.withRepository(this.explanationRepo).delete({ deviceId, profileHash: Not(profile.profileHash) });
        });
    }
    findExplanations(deviceId, profileHash, jobIds) {
        return jobIds.length ? this.explanationRepo.findBy({ deviceId, profileHash, jobId: In(jobIds) }) : Promise.resolve([]);
    }
    async saveExplanations(deviceId, profileHash, explanations) {
        if (!explanations.length) {
            return;
        }
        await this.explanationRepo.upsert(explanations.map((explanation) => ({ id: generateId('jme'), deviceId, profileHash, ...explanation })), { conflictPaths: ['deviceId', 'jobId'] });
    }
};
MatchingRepository = __decorate([
    Injectable(),
    __param(0, InjectRepository(JobMatchProfile)),
    __param(1, InjectRepository(JobMatchExplanationRow)),
    __metadata("design:paramtypes", [Repository,
        Repository])
], MatchingRepository);
export { MatchingRepository };
//# sourceMappingURL=matching.repository.js.map