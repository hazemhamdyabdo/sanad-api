export class FixCascadeDeletes1790193883674 {
    name = 'FixCascadeDeletes1790193883674';
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "messages" DROP CONSTRAINT "messages_sessionId_fkey"`);
        await queryRunner.query(`ALTER TABLE "messages" ADD CONSTRAINT "messages_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "conversation_sessions"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "cv_sections" DROP CONSTRAINT "cv_sections_cvId_fkey"`);
        await queryRunner.query(`ALTER TABLE "cv_sections" ADD CONSTRAINT "cv_sections_cvId_fkey" FOREIGN KEY ("cvId") REFERENCES "cvs"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "conversation_sessions" DROP CONSTRAINT "conversation_sessions_cvId_fkey"`);
        await queryRunner.query(`ALTER TABLE "conversation_sessions" ADD CONSTRAINT "conversation_sessions_cvId_fkey" FOREIGN KEY ("cvId") REFERENCES "cvs"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "conversation_sessions" DROP CONSTRAINT "conversation_sessions_uploadId_fkey"`);
        await queryRunner.query(`ALTER TABLE "conversation_sessions" ADD CONSTRAINT "conversation_sessions_uploadId_fkey" FOREIGN KEY ("uploadId") REFERENCES "uploads"("id") ON DELETE SET NULL`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "conversation_sessions" DROP CONSTRAINT "conversation_sessions_uploadId_fkey"`);
        await queryRunner.query(`ALTER TABLE "conversation_sessions" ADD CONSTRAINT "conversation_sessions_uploadId_fkey" FOREIGN KEY ("uploadId") REFERENCES "uploads"("id")`);
        await queryRunner.query(`ALTER TABLE "conversation_sessions" DROP CONSTRAINT "conversation_sessions_cvId_fkey"`);
        await queryRunner.query(`ALTER TABLE "conversation_sessions" ADD CONSTRAINT "conversation_sessions_cvId_fkey" FOREIGN KEY ("cvId") REFERENCES "cvs"("id")`);
        await queryRunner.query(`ALTER TABLE "cv_sections" DROP CONSTRAINT "cv_sections_cvId_fkey"`);
        await queryRunner.query(`ALTER TABLE "cv_sections" ADD CONSTRAINT "cv_sections_cvId_fkey" FOREIGN KEY ("cvId") REFERENCES "cvs"("id")`);
        await queryRunner.query(`ALTER TABLE "messages" DROP CONSTRAINT "messages_sessionId_fkey"`);
        await queryRunner.query(`ALTER TABLE "messages" ADD CONSTRAINT "messages_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "conversation_sessions"("id")`);
    }
}
//# sourceMappingURL=1790193883674-FixCascadeDeletes.js.map