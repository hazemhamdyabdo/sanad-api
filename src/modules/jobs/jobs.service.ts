import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { ProviderJob } from '../../integrations/jobs/job-provider.interface.js';
import type { TargetCountry } from './countries.js';
import { resolveApplyMethod } from './apply-method.js';
import { RoleIngestionRepository } from './role-ingestion.repository.js';
import { JobRepository } from './job.repository.js';
import { getRoleByCode, normalize, resolveRoleFromCvTitle, type RoleDefinition } from './roles.js';

const DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);

  constructor(
    private readonly roleIngestionRepository: RoleIngestionRepository,
    private readonly jobRepository: JobRepository,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Resolves a CV analysis's job title to one of the curated roles — deterministic, no LLM call (see
   * `resolveRoleFromCvTitle`). A title that matches nothing is left unmatched (never a guess) and
   * recorded so real usage can show which roles the curated list is missing.
   */
  async matchRoleForCvTitle(title: string | null | undefined): Promise<RoleDefinition | null> {
    const role = resolveRoleFromCvTitle(title);
    if (!role && title?.trim()) {
      await this.roleIngestionRepository.recordUnmatchedTitle(normalize(title), title.trim());
      this.logger.log(`No curated role matched CV title "${title}" — logged for review.`);
    }
    return role;
  }

  /**
   * The ONLY entry point anything should use to ask for a role's jobs — the seed script and (later)
   * whatever reacts to a CV analysis or a preferences change both call this and nothing else. It
   * never calls a job provider itself; it only marks the role's GROUP (see `roles.ts`) as needing a
   * fetch for this country, or does nothing if that group is already fresh or already queued. The
   * background sweep (`JobIngestionService`) is what actually spends a call.
   */
  async ensureRoleIngested(roleCode: string, country: TargetCountry): Promise<void> {
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
      return; // already queued — a second role in the same group, or a second user, changes nothing
    }

    if (existing.status === 'fresh') {
      const ttlMs = this.configService.get<number>('jobs.cacheTtlDays', 30) * DAY_MS;
      const age = existing.lastFetchedAt ? Date.now() - existing.lastFetchedAt.getTime() : Number.POSITIVE_INFINITY;
      if (age < ttlMs) {
        return; // still within the freshness window
      }
    }

    // Stale `fresh`, or a previous `failed` attempt — either way, worth trying again now that
    // something actually asked for it.
    existing.status = 'pending';
    await this.roleIngestionRepository.saveCache(existing);
    this.logger.log(`Re-queued role group "${role.group}" (${country}) for ingestion.`);
  }

  /**
   * Turns one keyword's raw provider results into stored `Job` rows — the apply-method heuristic and
   * entity mapping live here (business logic), not in `integrations/jobs`, so a second provider gets
   * both for free. Returns how many were written, for the sweep's own logging.
   */
  async upsertProviderJobs(jobs: ProviderJob[], role: RoleDefinition, country: TargetCountry, provider: string): Promise<number> {
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
        raw: job.raw,
      });
    }
    return jobs.length;
  }
}
