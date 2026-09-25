import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Job matching: pgvector, the embedding + pre-search filter columns on `jobs`, and three new tables
 * — `job_preferences` (one per device), `job_match_profiles` (the device's CV embedding, one per
 * device) and `job_match_explanations` (the LLM's per-job score/whyMatch/gaps for one CV version —
 * the per-user cache that keeps reopening the jobs screen from re-running the LLM).
 *
 * vector(1024) is mistral-embed's size — see `EMBEDDING_DIMENSIONS`. The `vector` extension must be
 * installable on the server (docker/postgres/Dockerfile compiles it into the dev image).
 */
export class AddJobMatching1790352000000 implements MigrationInterface {
  name = 'AddJobMatching1790352000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS vector`);

    await queryRunner.query(`
      ALTER TABLE "jobs"
        ADD COLUMN "workType" varchar,
        ADD COLUMN "employmentType" varchar,
        ADD COLUMN "city" varchar,
        ADD COLUMN "embedding" vector(1024),
        ADD COLUMN "embeddingModel" varchar,
        ADD COLUMN "embeddingTextHash" varchar
    `);
    await queryRunner.query(`CREATE INDEX "IDX_jobs_country" ON "jobs" ("country")`);
    // Cosine distance (<=>) is what matching sorts by. Small tables will just seq-scan; this matters
    // once there are real Jooble volumes.
    await queryRunner.query(`CREATE INDEX "IDX_jobs_embedding" ON "jobs" USING hnsw ("embedding" vector_cosine_ops)`);

    await queryRunner.query(`
      CREATE TABLE "job_preferences" (
        "deviceId" uuid PRIMARY KEY REFERENCES "devices"("id") ON DELETE CASCADE,
        "country" varchar NOT NULL,
        "city" varchar,
        "workTypes" jsonb NOT NULL,
        "willingToRelocate" boolean NOT NULL DEFAULT false,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "job_match_profiles" (
        "deviceId" uuid PRIMARY KEY REFERENCES "devices"("id") ON DELETE CASCADE,
        "profileHash" varchar NOT NULL,
        "embeddingModel" varchar NOT NULL,
        "embedding" vector(1024) NOT NULL,
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "job_match_explanations" (
        "id" varchar PRIMARY KEY,
        "deviceId" uuid NOT NULL REFERENCES "devices"("id") ON DELETE CASCADE,
        "jobId" varchar NOT NULL REFERENCES "jobs"("id") ON DELETE CASCADE,
        "profileHash" varchar NOT NULL,
        "match" integer NOT NULL,
        "whyMatch" jsonb NOT NULL,
        "gaps" jsonb NOT NULL,
        "createdAt" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_job_match_explanations_deviceId_jobId" ON "job_match_explanations" ("deviceId", "jobId")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "job_match_explanations"`);
    await queryRunner.query(`DROP TABLE "job_match_profiles"`);
    await queryRunner.query(`DROP TABLE "job_preferences"`);
    await queryRunner.query(`DROP INDEX "IDX_jobs_embedding"`);
    await queryRunner.query(`DROP INDEX "IDX_jobs_country"`);
    await queryRunner.query(`
      ALTER TABLE "jobs"
        DROP COLUMN "embeddingTextHash",
        DROP COLUMN "embeddingModel",
        DROP COLUMN "embedding",
        DROP COLUMN "city",
        DROP COLUMN "employmentType",
        DROP COLUMN "workType"
    `);
    // The extension is left installed on purpose — dropping it would fail if anything else ever uses it.
  }
}
