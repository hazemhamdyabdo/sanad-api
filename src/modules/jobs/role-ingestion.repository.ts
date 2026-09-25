import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { generateId } from '../../common/ids.js';
import { JobSearchCall } from './entities/job-search-call.entity.js';
import { RoleIngestionCache } from './entities/role-ingestion-cache.entity.js';
import { UnmatchedRoleTitle } from './entities/unmatched-role-title.entity.js';
import type { RoleGroupId } from './roles.js';
import type { TargetCountry } from './countries.js';

@Injectable()
export class RoleIngestionRepository {
  constructor(
    @InjectRepository(RoleIngestionCache) private readonly cacheRepo: Repository<RoleIngestionCache>,
    @InjectRepository(JobSearchCall) private readonly callRepo: Repository<JobSearchCall>,
    @InjectRepository(UnmatchedRoleTitle) private readonly unmatchedRepo: Repository<UnmatchedRoleTitle>,
  ) {}

  findCache(group: RoleGroupId, country: TargetCountry): Promise<RoleIngestionCache | null> {
    return this.cacheRepo.findOneBy({ group, country });
  }

  createCache(group: RoleGroupId, country: TargetCountry, status: RoleIngestionCache['status']): Promise<RoleIngestionCache> {
    return this.cacheRepo.save({ id: generateId('ric'), group, country, status, lastFetchedAt: null, lastError: null });
  }

  saveCache(cache: RoleIngestionCache): Promise<RoleIngestionCache> {
    return this.cacheRepo.save(cache);
  }

  /** Oldest first — so a role that's been waiting longest is fetched before one that just became pending. */
  findPendingCache(limit: number): Promise<RoleIngestionCache[]> {
    return this.cacheRepo.find({ where: { status: 'pending' }, order: { updatedAt: 'ASC' }, take: limit });
  }

  countCalls(provider: string, location: string): Promise<number> {
    return this.callRepo.countBy({ provider, location });
  }

  /** Whether this provider has ever fetched any of these keywords for this location — a group's freshness only counts for the provider that fetched it. */
  hasSucceededCall(provider: string, keywords: string[], location: string): Promise<boolean> {
    return this.callRepo.existsBy({ provider, keywords: In(keywords), location, succeeded: true });
  }

  recordCall(call: Omit<JobSearchCall, 'requestedAt'>): Promise<JobSearchCall> {
    return this.callRepo.save(call);
  }

  /** Upserts by normalized title so a repeated miss increments `count` instead of growing the table per occurrence. */
  async recordUnmatchedTitle(normalizedTitle: string, exampleTitle: string): Promise<void> {
    const existing = await this.unmatchedRepo.findOneBy({ normalizedTitle });
    if (existing) {
      existing.count += 1;
      existing.exampleTitle = exampleTitle;
      await this.unmatchedRepo.save(existing);
      return;
    }
    await this.unmatchedRepo.save({ id: generateId('urt'), normalizedTitle, exampleTitle, count: 1 });
  }
}
