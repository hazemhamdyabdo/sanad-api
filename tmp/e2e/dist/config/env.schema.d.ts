import { z } from 'zod';
export declare const envSchema: z.ZodObject<{
    NODE_ENV: z.ZodDefault<z.ZodEnum<{
        development: "development";
        test: "test";
        production: "production";
    }>>;
    PORT: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    DATABASE_HOST: z.ZodString;
    DATABASE_PORT: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    DATABASE_USER: z.ZodString;
    DATABASE_PASSWORD: z.ZodString;
    DATABASE_NAME: z.ZodString;
    DATABASE_SSL: z.ZodPipe<z.ZodDefault<z.ZodEnum<{
        true: "true";
        false: "false";
    }>>, z.ZodTransform<boolean, "true" | "false">>;
    LLM_PROVIDER: z.ZodDefault<z.ZodEnum<{
        mistral: "mistral";
        fake: "fake";
    }>>;
    AI_API_KEY: z.ZodOptional<z.ZodString>;
    AI_MODEL: z.ZodDefault<z.ZodString>;
    AI_EXTRACTION_MODEL: z.ZodDefault<z.ZodString>;
    STT_PROVIDER: z.ZodDefault<z.ZodEnum<{
        mistral: "mistral";
        fake: "fake";
    }>>;
    STT_MODEL: z.ZodDefault<z.ZodString>;
    EMBEDDING_PROVIDER: z.ZodDefault<z.ZodEnum<{
        mistral: "mistral";
        fake: "fake";
    }>>;
    EMBEDDING_MODEL: z.ZodDefault<z.ZodString>;
    EMAIL_PROVIDER: z.ZodDefault<z.ZodEnum<{
        fake: "fake";
        resend: "resend";
    }>>;
    RESEND_API_KEY: z.ZodOptional<z.ZodString>;
    EMAIL_FROM_ADDRESS: z.ZodOptional<z.ZodString>;
    EMAIL_FROM_NAME: z.ZodDefault<z.ZodString>;
    EMAIL_REDIRECT_TO: z.ZodPreprocess<z.ZodOptional<z.ZodString>, unknown>;
    JOB_PROVIDER: z.ZodDefault<z.ZodEnum<{
        fake: "fake";
        jooble: "jooble";
    }>>;
    JOOBLE_API_KEY_EG: z.ZodOptional<z.ZodString>;
    JOOBLE_API_KEY_SA: z.ZodOptional<z.ZodString>;
    JOOBLE_API_KEY_AE: z.ZodOptional<z.ZodString>;
    JOOBLE_API_KEY_DE: z.ZodOptional<z.ZodString>;
    JOOBLE_MAX_CALLS: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    JOB_CACHE_TTL_DAYS: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
}, z.core.$strip>;
export type Env = z.infer<typeof envSchema>;
export declare function validateEnv(config: Record<string, unknown>): Env;
