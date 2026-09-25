import { registerAs } from '@nestjs/config';
import { validateEnv } from './env.schema.js';
const env = validateEnv(process.env);
export const appConfig = registerAs('app', () => ({
    env: env.NODE_ENV,
    port: env.PORT,
}));
export const databaseConfig = registerAs('database', () => ({
    host: env.DATABASE_HOST,
    port: env.DATABASE_PORT,
    username: env.DATABASE_USER,
    password: env.DATABASE_PASSWORD,
    database: env.DATABASE_NAME,
    ssl: env.DATABASE_SSL,
}));
export const aiConfig = registerAs('ai', () => ({
    llmProvider: env.LLM_PROVIDER,
    apiKey: env.AI_API_KEY,
    model: env.AI_MODEL,
    extractionModel: env.AI_EXTRACTION_MODEL,
    sttProvider: env.STT_PROVIDER,
    sttModel: env.STT_MODEL,
    embeddingProvider: env.EMBEDDING_PROVIDER,
    embeddingModel: env.EMBEDDING_MODEL,
}));
export const emailConfig = registerAs('email', () => ({
    provider: env.EMAIL_PROVIDER,
    resendApiKey: env.RESEND_API_KEY,
    fromAddress: env.EMAIL_FROM_ADDRESS ?? 'applications@sanad.local',
    fromName: env.EMAIL_FROM_NAME,
    redirectTo: env.EMAIL_REDIRECT_TO ?? null,
}));
export const jobsConfig = registerAs('jobs', () => ({
    provider: env.JOB_PROVIDER,
    joobleApiKeys: { EG: env.JOOBLE_API_KEY_EG, SA: env.JOOBLE_API_KEY_SA, AE: env.JOOBLE_API_KEY_AE, DE: env.JOOBLE_API_KEY_DE },
    joobleMaxCalls: env.JOOBLE_MAX_CALLS,
    cacheTtlDays: env.JOB_CACHE_TTL_DAYS,
}));
//# sourceMappingURL=configuration.js.map