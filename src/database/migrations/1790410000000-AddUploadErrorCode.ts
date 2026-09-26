import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Why a CV upload failed, as a code (`uploads.errorCode`), so `GET /cv/uploads/:uploadId` can tell
 * the user "we couldn't read this file" apart from "the analysis took too long / was interrupted" —
 * different messages, different advice. `error` stays the technical detail for logs.
 */
export class AddUploadErrorCode1790410000000 implements MigrationInterface {
  name = 'AddUploadErrorCode1790410000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "uploads" ADD COLUMN "errorCode" varchar`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "uploads" DROP COLUMN "errorCode"`);
  }
}
