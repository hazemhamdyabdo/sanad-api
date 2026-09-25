export class AddJobs1790298140466 {
    name = 'AddJobs1790298140466';
    async up(queryRunner) {
        await queryRunner.query(`
      CREATE TABLE "jobs" (
        "id" varchar PRIMARY KEY,
        "provider" varchar NOT NULL,
        "externalId" varchar NOT NULL,
        "role" varchar NOT NULL,
        "group" varchar NOT NULL,
        "country" varchar NOT NULL,
        "title" varchar NOT NULL,
        "company" varchar,
        "location" varchar,
        "snippet" text,
        "salary" varchar,
        "jobType" varchar,
        "link" varchar NOT NULL,
        "applyMethod" varchar NOT NULL,
        "applyEmail" varchar,
        "sourceUpdatedAt" timestamptz,
        "raw" jsonb NOT NULL,
        "firstSeenAt" timestamptz NOT NULL DEFAULT now(),
        "lastSeenAt" timestamptz NOT NULL DEFAULT now()
      )
    `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_jobs_provider_externalId" ON "jobs" ("provider", "externalId")`);
        await queryRunner.query(`
      CREATE TABLE "role_ingestion_cache" (
        "id" varchar PRIMARY KEY,
        "group" varchar NOT NULL,
        "country" varchar NOT NULL,
        "status" varchar NOT NULL,
        "lastFetchedAt" timestamptz,
        "lastError" text,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      )
    `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_role_ingestion_cache_group_country" ON "role_ingestion_cache" ("group", "country")`);
        await queryRunner.query(`
      CREATE TABLE "job_search_calls" (
        "id" varchar PRIMARY KEY,
        "provider" varchar NOT NULL,
        "keywords" varchar NOT NULL,
        "location" varchar NOT NULL,
        "page" integer NOT NULL,
        "succeeded" boolean NOT NULL,
        "jobsReturned" integer,
        "totalCount" integer,
        "errorMessage" text,
        "requestedAt" timestamptz NOT NULL DEFAULT now()
      )
    `);
        await queryRunner.query(`
      CREATE TABLE "unmatched_role_titles" (
        "id" varchar PRIMARY KEY,
        "normalizedTitle" varchar NOT NULL,
        "exampleTitle" varchar NOT NULL,
        "count" integer NOT NULL DEFAULT 1,
        "firstSeenAt" timestamptz NOT NULL DEFAULT now(),
        "lastSeenAt" timestamptz NOT NULL DEFAULT now()
      )
    `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_unmatched_role_titles_normalizedTitle" ON "unmatched_role_titles" ("normalizedTitle")`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE "unmatched_role_titles"`);
        await queryRunner.query(`DROP TABLE "job_search_calls"`);
        await queryRunner.query(`DROP TABLE "role_ingestion_cache"`);
        await queryRunner.query(`DROP TABLE "jobs"`);
    }
}
//# sourceMappingURL=1790298140466-AddJobs.js.map