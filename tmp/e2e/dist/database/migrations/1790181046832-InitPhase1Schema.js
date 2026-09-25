export class InitPhase1Schema1790181046832 {
    name = 'InitPhase1Schema1790181046832';
    async up(queryRunner) {
        await queryRunner.query(`
      CREATE TABLE "devices" (
        "id" uuid PRIMARY KEY,
        "platform" varchar NOT NULL,
        "appVersion" varchar NOT NULL,
        "locale" varchar NOT NULL,
        "region" varchar NOT NULL,
        "createdAt" timestamptz NOT NULL DEFAULT now()
      )
    `);
        await queryRunner.query(`
      CREATE TABLE "uploads" (
        "id" varchar PRIMARY KEY,
        "deviceId" uuid NOT NULL REFERENCES "devices"("id"),
        "status" varchar NOT NULL,
        "currentStage" varchar,
        "filePath" varchar NOT NULL,
        "originalFileName" varchar NOT NULL,
        "mimeType" varchar NOT NULL,
        "summary" jsonb,
        "error" text,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "expiresAt" timestamptz NOT NULL
      )
    `);
        await queryRunner.query(`CREATE INDEX "IDX_uploads_deviceId" ON "uploads" ("deviceId")`);
        await queryRunner.query(`
      CREATE TABLE "cvs" (
        "id" varchar PRIMARY KEY,
        "deviceId" uuid NOT NULL REFERENCES "devices"("id"),
        "isComplete" boolean NOT NULL DEFAULT false,
        "confirmedSections" jsonb NOT NULL DEFAULT '[]',
        "name" varchar,
        "title" varchar,
        "contact" jsonb,
        "summary" text,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      )
    `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_cvs_deviceId" ON "cvs" ("deviceId")`);
        await queryRunner.query(`
      CREATE TABLE "conversation_sessions" (
        "id" varchar PRIMARY KEY,
        "deviceId" uuid NOT NULL REFERENCES "devices"("id"),
        "mode" varchar NOT NULL,
        "status" varchar NOT NULL,
        "currentSection" varchar,
        "sections" jsonb NOT NULL,
        "uploadId" varchar REFERENCES "uploads"("id"),
        "cvId" varchar REFERENCES "cvs"("id"),
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      )
    `);
        await queryRunner.query(`CREATE INDEX "IDX_conversation_sessions_deviceId" ON "conversation_sessions" ("deviceId")`);
        await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_conversation_sessions_deviceId_active"
      ON "conversation_sessions" ("deviceId")
      WHERE "status" = 'in_progress'
    `);
        await queryRunner.query(`
      CREATE TABLE "messages" (
        "id" varchar PRIMARY KEY,
        "sessionId" varchar NOT NULL REFERENCES "conversation_sessions"("id"),
        "role" varchar NOT NULL,
        "section" varchar,
        "type" varchar NOT NULL,
        "text" text,
        "card" jsonb,
        "quickReplies" jsonb,
        "source" varchar,
        "audioDurationSec" integer,
        "sequence" integer GENERATED ALWAYS AS IDENTITY,
        "createdAt" timestamptz NOT NULL DEFAULT now()
      )
    `);
        await queryRunner.query(`CREATE INDEX "IDX_messages_sessionId_sequence" ON "messages" ("sessionId", "sequence")`);
        await queryRunner.query(`
      CREATE TABLE "cv_sections" (
        "id" varchar PRIMARY KEY,
        "cvId" varchar NOT NULL REFERENCES "cvs"("id"),
        "section" varchar NOT NULL,
        "content" jsonb NOT NULL,
        "confirmedAt" timestamptz NOT NULL
      )
    `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_cv_sections_cvId_section" ON "cv_sections" ("cvId", "section")`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE "cv_sections"`);
        await queryRunner.query(`DROP TABLE "messages"`);
        await queryRunner.query(`DROP TABLE "conversation_sessions"`);
        await queryRunner.query(`DROP TABLE "cvs"`);
        await queryRunner.query(`DROP TABLE "uploads"`);
        await queryRunner.query(`DROP TABLE "devices"`);
    }
}
//# sourceMappingURL=1790181046832-InitPhase1Schema.js.map