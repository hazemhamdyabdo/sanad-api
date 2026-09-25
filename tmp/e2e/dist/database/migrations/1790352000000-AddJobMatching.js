export class AddJobMatching1790352000000 {
    name = 'AddJobMatching1790352000000';
    async up(queryRunner) {
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
    async down(queryRunner) {
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
    }
}
//# sourceMappingURL=1790352000000-AddJobMatching.js.map