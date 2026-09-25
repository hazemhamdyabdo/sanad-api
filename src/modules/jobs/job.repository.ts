import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import type { EmploymentType, WorkType } from '../../common/types/contract.js';
import { generateId } from '../../common/ids.js';
import type { TargetCountry } from './countries.js';
import { Job } from './entities/job.entity.js';
import type { RoleGroupId } from './roles.js';

/** A job the enrichment pass still has to embed (or re-derive facets for) — just what it needs, not the whole row. */
export interface UnenrichedJobRow {
  id: string;
  role: string;
  group: RoleGroupId;
  country: TargetCountry;
  title: string;
  location: string | null;
  snippet: string | null;
  jobType: string | null;
}

export interface JobEnrichment {
  workType: WorkType;
  employmentType: EmploymentType;
  city: string | null;
  embedding: number[];
  embeddingModel: string;
  embeddingTextHash: string;
}

export interface SimilarJobsFilter {
  /** null = any country. */
  countries: TargetCountry[] | null;
  workTypes: WorkType[];
  /** null = any city. Jobs with no known city always pass — they aren't tied to one. */
  city: string | null;
  /** null = any group. */
  group: RoleGroupId | null;
}

export interface SimilarJobRow {
  id: string;
  /** Cosine similarity, 1 = identical direction. */
  similarity: number;
}

/** pgvector's text input format — passed as a parameter and cast with `::vector`, never interpolated. */
function toVectorLiteral(vector: number[]): string {
  return `[${vector.join(',')}]`;
}

@Injectable()
export class JobRepository {
  constructor(@InjectRepository(Job) private readonly jobRepo: Repository<Job>) {}

  /**
   * Insert-or-refresh by `(provider, externalId)` — the same posting seen again just bumps
   * `lastSeenAt` and refreshes mutable fields (salary, snippet, ...) rather than duplicating. `id` is
   * never taken from the caller: an existing row keeps its own id (overwriting it here would try to
   * re-insert under a new primary key and collide with the `(provider, externalId)` unique index).
   * A changed title or description invalidates the stored embedding, so the next enrichment pass
   * re-embeds it instead of matching against the old text.
   */
  async upsert(job: Omit<Job, 'id' | 'firstSeenAt' | 'lastSeenAt'>): Promise<void> {
    const existing = await this.jobRepo.findOneBy({ provider: job.provider, externalId: job.externalId });
    if (existing) {
      const textChanged = existing.title !== job.title || existing.snippet !== job.snippet || existing.role !== job.role;
      await this.jobRepo.save(Object.assign(existing, job));
      if (textChanged) {
        await this.jobRepo.query(`UPDATE "jobs" SET "embedding" = NULL, "embeddingTextHash" = NULL WHERE "id" = $1`, [existing.id]);
      }
    } else {
      await this.jobRepo.save({ id: generateId('job'), ...job });
    }
  }

  /** Jobs with no embedding yet, one from a different model, or missing facets (rows ingested before matching existed). */
  async findUnenriched(embeddingModel: string, countries: TargetCountry[] | null, limit: number): Promise<UnenrichedJobRow[]> {
    const rows: UnenrichedJobRow[] = await this.jobRepo.query(
      `SELECT "id", "role", "group", "country", "title", "location", "snippet", "jobType"
         FROM "jobs"
        WHERE ("embedding" IS NULL OR "embeddingModel" IS DISTINCT FROM $1 OR "workType" IS NULL)
          AND ($2::varchar[] IS NULL OR "country" = ANY($2))
        ORDER BY "firstSeenAt" ASC
        LIMIT $3`,
      [embeddingModel, countries, limit],
    );
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

  async saveEnrichment(id: string, enrichment: JobEnrichment): Promise<void> {
    await this.jobRepo.query(
      `UPDATE "jobs"
          SET "workType" = $2, "employmentType" = $3, "city" = $4,
              "embedding" = $5::vector, "embeddingModel" = $6, "embeddingTextHash" = $7
        WHERE "id" = $1`,
      [id, enrichment.workType, enrichment.employmentType, enrichment.city, toVectorLiteral(enrichment.embedding), enrichment.embeddingModel, enrichment.embeddingTextHash],
    );
  }

  /**
   * The vector stage of matching: hard filters first (country, work type, city, role group), then
   * nearest by cosine distance. `iterative_scan` makes the HNSW index keep scanning until `limit`
   * rows pass the WHERE clause, instead of filtering a fixed-size candidate list and coming back
   * short — scoped to this one transaction with SET LOCAL.
   */
  async searchByEmbedding(embedding: number[], embeddingModel: string, provider: string, filter: SimilarJobsFilter, limit: number): Promise<SimilarJobRow[]> {
    return this.jobRepo.manager.transaction(async (manager) => {
      await manager.query(`SET LOCAL hnsw.iterative_scan = strict_order`);
      const rows: Array<{ id: string; similarity: string | number }> = await manager.query(
        `SELECT "id", 1 - ("embedding" <=> $1::vector) AS "similarity"
           FROM "jobs"
          WHERE "embedding" IS NOT NULL
            AND "embeddingModel" = $2
            AND ($3::varchar[] IS NULL OR "country" = ANY($3))
            AND "workType" = ANY($4::varchar[])
            AND ($5::varchar IS NULL OR "city" IS NULL OR "city" = $5)
            AND ($6::varchar IS NULL OR "group" = $6)
            AND "provider" = $7
          ORDER BY "embedding" <=> $1::vector
          LIMIT $8`,
        [toVectorLiteral(embedding), embeddingModel, filter.countries, filter.workTypes, filter.city, filter.group, provider, limit],
      );
      return rows.map((row) => ({ id: row.id, similarity: Number(row.similarity) }));
    });
  }

  findByIds(ids: string[]): Promise<Job[]> {
    return ids.length ? this.jobRepo.findBy({ id: In(ids) }) : Promise.resolve([]);
  }
}
