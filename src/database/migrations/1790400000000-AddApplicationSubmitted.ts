import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * `submitted`: the user finished an `external` application on the listing site and told us so
 * (`POST /applications/:id/submitted`). Only a timestamp is new — the status itself lives in the
 * existing varchar column.
 */
export class AddApplicationSubmitted1790400000000 implements MigrationInterface {
  name = 'AddApplicationSubmitted1790400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "applications" ADD COLUMN "submittedAt" timestamptz`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`UPDATE "applications" SET "status" = 'opened' WHERE "status" = 'submitted'`);
    await queryRunner.query(`ALTER TABLE "applications" DROP COLUMN "submittedAt"`);
  }
}
