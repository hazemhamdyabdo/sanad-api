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
import { JobSearchCall } from './entities/job-search-call.entity.js';
import { RoleIngestionCache } from './entities/role-ingestion-cache.entity.js';
import { UnmatchedRoleTitle } from './entities/unmatched-role-title.entity.js';
let RoleIngestionRepository = class RoleIngestionRepository {
    cacheRepo;
    callRepo;
    unmatchedRepo;
    constructor(cacheRepo, callRepo, unmatchedRepo) {
        this.cacheRepo = cacheRepo;
        this.callRepo = callRepo;
        this.unmatchedRepo = unmatchedRepo;
    }
    findCache(group, country) {
        return this.cacheRepo.findOneBy({ group, country });
    }
    createCache(group, country, status) {
        return this.cacheRepo.save({ id: generateId('ric'), group, country, status, lastFetchedAt: null, lastError: null });
    }
    saveCache(cache) {
        return this.cacheRepo.save(cache);
    }
    findPendingCache(limit) {
        return this.cacheRepo.find({ where: { status: 'pending' }, order: { updatedAt: 'ASC' }, take: limit });
    }
    countCalls(provider, location) {
        return this.callRepo.countBy({ provider, location });
    }
    hasSucceededCall(provider, keywords, location) {
        return this.callRepo.existsBy({ provider, keywords: In(keywords), location, succeeded: true });
    }
    recordCall(call) {
        return this.callRepo.save(call);
    }
    async recordUnmatchedTitle(normalizedTitle, exampleTitle) {
        const existing = await this.unmatchedRepo.findOneBy({ normalizedTitle });
        if (existing) {
            existing.count += 1;
            existing.exampleTitle = exampleTitle;
            await this.unmatchedRepo.save(existing);
            return;
        }
        await this.unmatchedRepo.save({ id: generateId('urt'), normalizedTitle, exampleTitle, count: 1 });
    }
};
RoleIngestionRepository = __decorate([
    Injectable(),
    __param(0, InjectRepository(RoleIngestionCache)),
    __param(1, InjectRepository(JobSearchCall)),
    __param(2, InjectRepository(UnmatchedRoleTitle)),
    __metadata("design:paramtypes", [Repository,
        Repository,
        Repository])
], RoleIngestionRepository);
export { RoleIngestionRepository };
//# sourceMappingURL=role-ingestion.repository.js.map