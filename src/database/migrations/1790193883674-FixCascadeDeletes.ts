import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * The initial migration left every FK at Postgres's default ON DELETE NO
 * ACTION. That blocks deleting a session once it has messages, and a cv
 * once it has sections — both routine operations (DELETE /conversations,
 * restarting a session). Device FKs are left as NO ACTION on purpose:
 * nothing deletes a Device in this phase.
 */
export class FixCascadeDeletes1790193883674 implements MigrationInterface {
  name = 'FixCascadeDeletes1790193883674';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "messages" DROP CONSTRAINT "messages_sessionId_fkey"`);
    await queryRunner.query(
      `ALTER TABLE "messages" ADD CONSTRAINT "messages_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "conversation_sessions"("id") ON DELETE CASCADE`,
    );

    await queryRunner.query(`ALTER TABLE "cv_sections" DROP CONSTRAINT "cv_sections_cvId_fkey"`);
    await queryRunner.query(
      `ALTER TABLE "cv_sections" ADD CONSTRAINT "cv_sections_cvId_fkey" FOREIGN KEY ("cvId") REFERENCES "cvs"("id") ON DELETE CASCADE`,
    );

    await queryRunner.query(`ALTER TABLE "conversation_sessions" DROP CONSTRAINT "conversation_sessions_cvId_fkey"`);
    await queryRunner.query(
      `ALTER TABLE "conversation_sessions" ADD CONSTRAINT "conversation_sessions_cvId_fkey" FOREIGN KEY ("cvId") REFERENCES "cvs"("id") ON DELETE CASCADE`,
    );

    await queryRunner.query(`ALTER TABLE "conversation_sessions" DROP CONSTRAINT "conversation_sessions_uploadId_fkey"`);
    await queryRunner.query(
      `ALTER TABLE "conversation_sessions" ADD CONSTRAINT "conversation_sessions_uploadId_fkey" FOREIGN KEY ("uploadId") REFERENCES "uploads"("id") ON DELETE SET NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "conversation_sessions" DROP CONSTRAINT "conversation_sessions_uploadId_fkey"`);
    await queryRunner.query(
      `ALTER TABLE "conversation_sessions" ADD CONSTRAINT "conversation_sessions_uploadId_fkey" FOREIGN KEY ("uploadId") REFERENCES "uploads"("id")`,
    );

    await queryRunner.query(`ALTER TABLE "conversation_sessions" DROP CONSTRAINT "conversation_sessions_cvId_fkey"`);
    await queryRunner.query(
      `ALTER TABLE "conversation_sessions" ADD CONSTRAINT "conversation_sessions_cvId_fkey" FOREIGN KEY ("cvId") REFERENCES "cvs"("id")`,
    );

    await queryRunner.query(`ALTER TABLE "cv_sections" DROP CONSTRAINT "cv_sections_cvId_fkey"`);
    await queryRunner.query(`ALTER TABLE "cv_sections" ADD CONSTRAINT "cv_sections_cvId_fkey" FOREIGN KEY ("cvId") REFERENCES "cvs"("id")`);

    await queryRunner.query(`ALTER TABLE "messages" DROP CONSTRAINT "messages_sessionId_fkey"`);
    await queryRunner.query(
      `ALTER TABLE "messages" ADD CONSTRAINT "messages_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "conversation_sessions"("id")`,
    );
  }
}
