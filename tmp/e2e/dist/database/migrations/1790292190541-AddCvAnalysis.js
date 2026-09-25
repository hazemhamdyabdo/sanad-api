export class AddCvAnalysis1790292190541 {
    name = 'AddCvAnalysis1790292190541';
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "uploads" DROP COLUMN "summary"`);
        await queryRunner.query(`
      CREATE TABLE "cv_analyses" (
        "id" varchar PRIMARY KEY,
        "deviceId" uuid NOT NULL REFERENCES "devices"("id"),
        "uploadId" varchar REFERENCES "uploads"("id") ON DELETE SET NULL,
        "cv" jsonb NOT NULL,
        "sectionConfidence" jsonb NOT NULL,
        "seniority" varchar NOT NULL,
        "yearsOfExperience" real,
        "skills" jsonb NOT NULL,
        "domains" jsonb NOT NULL,
        "strengths" jsonb NOT NULL,
        "gaps" jsonb NOT NULL,
        "qualityIssues" jsonb NOT NULL,
        "overallScore" integer NOT NULL,
        "scoreReason" text NOT NULL,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      )
    `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_cv_analyses_deviceId" ON "cv_analyses" ("deviceId")`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE "cv_analyses"`);
        await queryRunner.query(`ALTER TABLE "uploads" ADD COLUMN "summary" jsonb`);
    }
}
//# sourceMappingURL=1790292190541-AddCvAnalysis.js.map