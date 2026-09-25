import { z } from 'zod';
export const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(3000),
    DATABASE_HOST: z.string().min(1),
    DATABASE_PORT: z.coerce.number().int().positive().default(5432),
    DATABASE_USER: z.string().min(1),
    DATABASE_PASSWORD: z.string().min(1),
    DATABASE_NAME: z.string().min(1),
    DATABASE_SSL: z
        .enum(['true', 'false'])
        .default('false')
        .transform((value) => value === 'true'),
    LLM_PROVIDER: z.enum(['mistral', 'fake']).default('fake'),
    AI_API_KEY: z.string().optional(),
    AI_MODEL: z.string().default('mistral-small-latest'),
    AI_EXTRACTION_MODEL: z.string().default('mistral-medium-latest'),
    STT_PROVIDER: z.enum(['mistral', 'fake']).default('fake'),
    STT_MODEL: z.string().default('voxtral-mini-latest'),
    EMBEDDING_PROVIDER: z.enum(['mistral', 'fake']).default('fake'),
    EMBEDDING_MODEL: z.string().default('mistral-embed'),
    EMAIL_PROVIDER: z.enum(['resend', 'fake']).default('fake'),
    RESEND_API_KEY: z.string().optional(),
    EMAIL_FROM_ADDRESS: z.string().email().optional(),
    EMAIL_FROM_NAME: z.string().default('Sanad'),
    EMAIL_REDIRECT_TO: z.preprocess((value) => (value === '' ? undefined : value), z.string().email().optional()),
    JOB_PROVIDER: z.enum(['jooble', 'fake']).default('fake'),
    JOOBLE_API_KEY_EG: z.string().optional(),
    JOOBLE_API_KEY_SA: z.string().optional(),
    JOOBLE_API_KEY_AE: z.string().optional(),
    JOOBLE_API_KEY_DE: z.string().optional(),
    JOOBLE_MAX_CALLS: z.coerce.number().int().positive().default(450),
    JOB_CACHE_TTL_DAYS: z.coerce.number().int().positive().default(30),
});
const envSchemaWithCrossFieldRules = envSchema
    .refine((env) => env.LLM_PROVIDER !== 'mistral' || !!env.AI_API_KEY, {
    message: 'AI_API_KEY is required when LLM_PROVIDER=mistral',
    path: ['AI_API_KEY'],
})
    .refine((env) => env.STT_PROVIDER !== 'mistral' || !!env.AI_API_KEY, {
    message: 'AI_API_KEY is required when STT_PROVIDER=mistral',
    path: ['AI_API_KEY'],
})
    .refine((env) => env.EMBEDDING_PROVIDER !== 'mistral' || !!env.AI_API_KEY, {
    message: 'AI_API_KEY is required when EMBEDDING_PROVIDER=mistral',
    path: ['AI_API_KEY'],
})
    .refine((env) => env.EMAIL_PROVIDER !== 'resend' || (!!env.RESEND_API_KEY && !!env.EMAIL_FROM_ADDRESS), {
    message: 'RESEND_API_KEY and EMAIL_FROM_ADDRESS are required when EMAIL_PROVIDER=resend',
    path: ['RESEND_API_KEY'],
})
    .refine((env) => env.JOB_PROVIDER !== 'jooble' || !!(env.JOOBLE_API_KEY_EG || env.JOOBLE_API_KEY_SA || env.JOOBLE_API_KEY_AE || env.JOOBLE_API_KEY_DE), {
    message: 'At least one of JOOBLE_API_KEY_EG / _SA / _AE / _DE is required when JOB_PROVIDER=jooble (a jooble.org key is US-only)',
    path: ['JOOBLE_API_KEY_EG'],
});
export function validateEnv(config) {
    const result = envSchemaWithCrossFieldRules.safeParse(config);
    if (!result.success) {
        const issues = result.error.issues
            .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
            .join('; ');
        throw new Error(`Invalid environment configuration: ${issues}`);
    }
    return result.data;
}
//# sourceMappingURL=env.schema.js.map