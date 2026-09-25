import { Repository } from 'typeorm';
import { JobSearchCall } from './entities/job-search-call.entity.js';
import { RoleIngestionCache } from './entities/role-ingestion-cache.entity.js';
import { UnmatchedRoleTitle } from './entities/unmatched-role-title.entity.js';
import type { RoleGroupId } from './roles.js';
import type { TargetCountry } from './countries.js';
export declare class RoleIngestionRepository {
    private readonly cacheRepo;
    private readonly callRepo;
    private readonly unmatchedRepo;
    constructor(cacheRepo: Repository<RoleIngestionCache>, callRepo: Repository<JobSearchCall>, unmatchedRepo: Repository<UnmatchedRoleTitle>);
    findCache(group: RoleGroupId, country: TargetCountry): Promise<RoleIngestionCache | null>;
    createCache(group: RoleGroupId, country: TargetCountry, status: RoleIngestionCache['status']): Promise<RoleIngestionCache>;
    saveCache(cache: RoleIngestionCache): Promise<RoleIngestionCache>;
    findPendingCache(limit: number): Promise<RoleIngestionCache[]>;
    countCalls(provider: string, location: string): Promise<number>;
    hasSucceededCall(provider: string, keywords: string[], location: string): Promise<boolean>;
    recordCall(call: Omit<JobSearchCall, 'requestedAt'>): Promise<JobSearchCall>;
    recordUnmatchedTitle(normalizedTitle: string, exampleTitle: string): Promise<void>;
}
