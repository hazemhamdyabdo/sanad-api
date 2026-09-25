import { Inject, Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { generateId } from '../../common/ids.js';
import { JOB_PROVIDER, type JobProvider } from '../../integrations/jobs/job-provider.interface.js';
import { JOOBLE_LOCATION_BY_COUNTRY, type TargetCountry } from './countries.js';
import type { RoleIngestionCache } from './entities/role-ingestion-cache.entity.js';
import { JobsService } from './jobs.service.js';
import { RoleIngestionRepository } from './role-ingestion.repository.js';
import { getGroupById, ROLE_DEFINITIONS } from './roles.js';

/**
 * No queue/scheduler library in this project — a plain interval, same pattern as
 * `UploadCleanupService`. A short interval is safe here because it's cheap to run when there's
 * nothing pending (one DB query) and it never spends a call on its own — only demand
 * (`JobsService.ensureRoleIngested` marking something `pending`) ever leads to an actual fetch. This
 * is the "schedule" that keeps a user's own request from ever directly triggering a Jooble call.
 */
// Short on purpose: a user whose field was never fetched is looking at an empty "searching" screen
// until the next sweep, and an idle sweep is one DB query.
const SWEEP_INTERVAL_MS = 5 * 1000;
/** Small on purpose — naturally rate-limits a burst of many roles becoming pending at once. */
const BATCH_SIZE = 5;

/**
 * Picks up `pending` role groups (see `RoleIngestionCache`) and actually calls the job provider —
 * the only place in the app that does. Every call is budget-checked first and logged either way
 * (`JobSearchCall`), and a group's several keywords are ingested together, one call each, before the
 * group is marked `fresh`.
 */
@Injectable()
export class JobIngestionService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(JobIngestionService.name);
  private timer: ReturnType<typeof setInterval> | null = null;
  /** A sweep can take longer than the interval (several provider calls + embedding) — never run two at once, or a pending group would be fetched (and paid for) twice. */
  private sweeping = false;

  constructor(
    private readonly roleIngestionRepository: RoleIngestionRepository,
    private readonly jobsService: JobsService,
    private readonly configService: ConfigService,
    @Inject(JOB_PROVIDER) private readonly provider: JobProvider,
  ) {}

  onModuleInit(): void {
    this.timer = setInterval(() => {
      this.runSweepOnce().catch((error) => this.logger.error('Job ingestion sweep failed', error instanceof Error ? error.stack : error));
    }, SWEEP_INTERVAL_MS);
    this.timer.unref?.();
  }

  onModuleDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  /** Public so a seed/admin script can trigger one pass immediately instead of waiting for the interval — the exact same code path, not a shortcut. */
  async runSweepOnce(): Promise<void> {
    if (this.sweeping) {
      return;
    }
    this.sweeping = true;
    try {
      await this.sweep();
    } finally {
      this.sweeping = false;
    }
  }

  private async sweep(): Promise<void> {
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
      // Freshly ingested jobs are only matchable once embedded — do it now rather than on the
      // first user's request.
      await this.jobsService.enrichPendingJobs();
    }
  }

  /** Per country: Jooble's lifetime cap is per key, and each country has its own key. */
  private async hasBudget(country: TargetCountry): Promise<boolean> {
    const providerName = this.configService.get<string>('jobs.provider', 'fake');
    const used = await this.roleIngestionRepository.countCalls(providerName, JOOBLE_LOCATION_BY_COUNTRY[country]);
    const max = this.configService.get<number>('jobs.joobleMaxCalls', 450);
    return used < max;
  }

  private async ingestGroup(cache: RoleIngestionCache): Promise<void> {
    const group = getGroupById(cache.group);
    const location = JOOBLE_LOCATION_BY_COUNTRY[cache.country];
    const providerName = this.configService.get<string>('jobs.provider', 'fake');

    let allSucceeded = true;
    let lastError: string | null = null;

    for (const keyword of group.keywords) {
      // Re-checked per keyword, not just once per group — a group can have several keywords, and the
      // budget could run out partway through one.
      if (!(await this.hasBudget(cache.country))) {
        allSucceeded = false;
        lastError = 'JOOBLE_MAX_CALLS reached mid-group';
        this.logger.error(`Job search budget exhausted mid-group "${cache.group}" (${cache.country}).`);
        break;
      }

      // Asserted at module load in roles.ts — every group keyword has exactly one owning role.
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
      } catch (error) {
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
}
