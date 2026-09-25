import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * `uploads.summary` (the old found/missingSections/missingFields shape) is replaced by the richer
 * `cv_analyses` table — one row per device, holding both the draft CV fields and the deeper analysis
 * (seniority, categorized skills, domains, strengths/gaps, quality issues, score) a CV upload
 * produces. See `modules/cv/entities/cv-analysis.entity.ts`.
 */
export class AddCvAnalysis1790292190541 implements MigrationInterface {
  name = 'AddCvAnalysis1790292190541';

  public async up(queryRunner: QueryRunner): Promise<void> {
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

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "cv_analyses"`);
    await queryRunner.query(`ALTER TABLE "uploads" ADD COLUMN "summary" jsonb`);
  }
}
