import { createHash } from 'node:crypto';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { EmploymentType, WorkType } from '../../common/types/contract.js';
import { EMBEDDING_PROVIDER, type EmbeddingProvider } from '../../integrations/embeddings/embedding.interface.js';
import type { ProviderJob } from '../../integrations/jobs/job-provider.interface.js';
import { JOOBLE_LOCATION_BY_COUNTRY, type TargetCountry } from './countries.js';
import { resolveApplyMethod } from './apply-method.js';
import { resolveCity } from './cities.js';
import { buildJobEmbeddingText } from './embedding-text.js';
import type { Job } from './entities/job.entity.js';
import type { RoleIngestionStatus } from './entities/role-ingestion-cache.entity.js';
import { deriveEmploymentType, deriveWorkType } from './job-facets.js';
import { JobRepository, type SimilarJobRow, type SimilarJobsFilter, type UnenrichedJobRow } from './job.repository.js';
import { RoleIngestionRepository } from './role-ingestion.repository.js';
import { getGroupById, getRoleByCode, normalize, resolveRoleFromCvTitle, type RoleDefinition, type RoleGroupId } from './roles.js';

const DAY_MS = 24 * 60 * 60 * 1000;
/** Per enrichment call — bounds one request's embedding work; anything left is picked up by the next call or sweep. */
const ENRICH_BATCH_SIZE = 200;

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);

  constructor(
    private readonly roleIngestionRepository: RoleIngestionRepository,
    private readonly jobRepository: JobRepository,
    private readonly configService: ConfigService,
    @Inject(EMBEDDING_PROVIDER) private readonly embeddings: EmbeddingProvider,
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
   * The CV's target role: its headline title first (logged when unmatched, same as
   * `matchRoleForCvTitle`), then each past job title in order — someone whose headline is
   * "Sales & Accounts Associate" but who worked as an "Accountant" still gets a role. Null when
   * nothing matches; the caller matches on vectors alone then.
   */
  async resolveTargetRole(headline: string | null, pastTitles: string[]): Promise<RoleDefinition | null> {
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

  /** The ingestion cache's state for one group in one country, or null if nothing ever asked for it. */
  async getIngestionStatus(group: RoleGroupId, country: TargetCountry): Promise<RoleIngestionStatus | null> {
    return (await this.roleIngestionRepository.findCache(group, country))?.status ?? null;
  }

  /**
   * The ONLY entry point anything should use to ask for a role's jobs — the seed script and job
   * matching (for the CV's role in the preferred country) both call this and nothing else. It
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
      // Fresh only for the provider that fetched it — after switching JOB_PROVIDER (fake → jooble),
      // the old provider's "fresh" must not block the real fetch for the rest of the TTL.
      const provider = this.configService.get<string>('jobs.provider', 'fake');
      const fetchedByActiveProvider = await this.roleIngestionRepository.hasSucceededCall(
        provider,
        getGroupById(role.group).keywords,
        JOOBLE_LOCATION_BY_COUNTRY[country],
      );
      if (age < ttlMs && fetchedByActiveProvider) {
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
   * Turns one keyword's raw provider results into stored `Job` rows — the apply-method heuristic,
   * the matching facets (work type, employment type, city) and entity mapping live here (business
   * logic), not in `integrations/jobs`, so a second provider gets all of it for free. Returns how
   * many were written, for the sweep's own logging. Embeddings are added afterwards by
   * `enrichPendingJobs`.
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
        ...this.deriveFacets({ role: role.code, country, title: job.title, location: job.location, snippet: job.snippet, jobType: job.jobType }),
        raw: job.raw,
      });
    }
    return jobs.length;
  }

  /**
   * Embeds every job that has no embedding yet (or one from a different model) and fills in any
   * missing facets — called after each ingestion sweep and again right before a match, so jobs are
   * always searchable by the time anyone searches. Returns how many rows were enriched.
   */
  async enrichPendingJobs(countries: TargetCountry[] | null = null): Promise<number> {
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

  /**
   * The vector stage of matching — see `JobRepository.searchByEmbedding`. `embedding` must come from
   * this same provider's model. Only jobs from the active job provider are candidates, so fake dev
   * listings left in the table can never be shown (or applied to) once the real provider is on.
   */
  searchSimilarJobs(embedding: number[], filter: SimilarJobsFilter, limit: number): Promise<SimilarJobRow[]> {
    const provider = this.configService.get<string>('jobs.provider', 'fake');
    return this.jobRepository.searchByEmbedding(embedding, this.embeddings.model, provider, filter, limit);
  }

  findJobsByIds(ids: string[]): Promise<Job[]> {
    return this.jobRepository.findByIds(ids);
  }

  private deriveFacets(job: Pick<UnenrichedJobRow, 'role' | 'country' | 'title' | 'location' | 'snippet' | 'jobType'>): { workType: WorkType; employmentType: EmploymentType; city: string | null } {
    return {
      workType: deriveWorkType(job.title, job.snippet, job.location, job.jobType),
      employmentType: deriveEmploymentType(job.role, job.jobType, job.title, job.snippet),
      city: resolveCity(job.country, job.location),
    };
  }
}
