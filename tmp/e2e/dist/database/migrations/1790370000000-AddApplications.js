export class AddApplications1790370000000 {
    name = 'AddApplications1790370000000';
    async up(queryRunner) {
        await queryRunner.query(`
      CREATE TABLE "application_batches" (
        "id" varchar PRIMARY KEY,
        "deviceId" uuid NOT NULL REFERENCES "devices"("id") ON DELETE CASCADE,
        "status" varchar NOT NULL,
        "applicationIds" jsonb NOT NULL,
        "alreadyAppliedIds" jsonb NOT NULL,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "completedAt" timestamptz
      )
    `);
        await queryRunner.query(`
      CREATE TABLE "applications" (
        "id" varchar PRIMARY KEY,
        "deviceId" uuid NOT NULL REFERENCES "devices"("id") ON DELETE CASCADE,
        "jobId" varchar REFERENCES "jobs"("id") ON DELETE SET NULL,
        "batchId" varchar NOT NULL REFERENCES "application_batches"("id") ON DELETE CASCADE,
        "method" varchar NOT NULL,
        "status" varchar NOT NULL,
        "stage" varchar,
        "jobTitle" varchar NOT NULL,
        "company" varchar,
        "location" varchar,
        "listingUrl" varchar NOT NULL,
        "recipientEmail" varchar,
        "tailoredCv" jsonb,
        "cvTailored" boolean NOT NULL DEFAULT false,
        "errorCode" varchar,
        "errorDetail" text,
        "providerMessageId" varchar,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        "sentAt" timestamptz,
        "preparedAt" timestamptz,
        "openedAt" timestamptz,
        "failedAt" timestamptz
      )
    `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_applications_deviceId_jobId" ON "applications" ("deviceId", "jobId")`);
        await queryRunner.query(`CREATE INDEX "IDX_applications_status" ON "applications" ("status")`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE "applications"`);
        await queryRunner.query(`DROP TABLE "application_batches"`);
    }
}
//# sourceMappingURL=1790370000000-AddApplications.js.map