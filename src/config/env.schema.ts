import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DEMO_MODE: z.enum(['true', 'false']).default('false').transform((value) => value === 'true'),
  UPLOAD_DIR: z.string().min(1).default('uploads'),
  EMAIL_OUTBOX_DIR: z.string().min(1).default('tmp/outbox'),

  DATABASE_HOST: z.string().min(1),
  DATABASE_PORT: z.coerce.number().int().positive().default(5432),
  DATABASE_USER: z.string().min(1),
  DATABASE_PASSWORD: z.string().min(1),
  DATABASE_NAME: z.string().min(1),
  // z.coerce.boolean() does `Boolean(value)`, so the string "false" would
  // coerce to true — parse the actual string values instead.
  DATABASE_SSL: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),

  LLM_PROVIDER: z.enum(['mistral', 'fake']).default('fake'),
  AI_API_KEY: z.string().optional(),
  AI_MODEL: z.string().default('mistral-small-latest'),
  // Turning a finished section's chat into a card. mistral-small returned [] for real, clearly stated
  // jobs/degrees in most attempts; mistral-medium didn't once, and the call is short so cost stays low.
  AI_EXTRACTION_MODEL: z.string().default('mistral-medium-latest'),
  // Speech-to-text. Reuses AI_API_KEY — same vendor account as the LLM.
  STT_PROVIDER: z.enum(['mistral', 'fake']).default('fake'),
  STT_MODEL: z.string().default('voxtral-mini-latest'),
  // Embeddings for job matching (pgvector). Reuses AI_API_KEY. "fake" is a local, deterministic
  // bag-of-words hash — no network calls, but similar texts still land close together.
  EMBEDDING_PROVIDER: z.enum(['mistral', 'fake']).default('fake'),
  EMBEDDING_MODEL: z.string().default('mistral-embed'),

  // Job search. "fake" (the default) makes no network calls — Jooble's free plan is a total
  // LIFETIME limit of 500 requests per key, not a renewing quota, so nothing should ever default to
  // spending it.
  // Sending application emails. "fake" writes each email (text, HTML, PDF) to ./tmp/outbox instead of
  // sending — nothing leaves the machine.
  EMAIL_PROVIDER: z.enum(['resend', 'fake']).default('fake'),
  RESEND_API_KEY: z.string().optional(),
  // The sending address — must be on a domain verified with the provider (SPF/DKIM), except Resend's
  // own onboarding@resend.dev, which can only deliver to the Resend account owner's address.
  EMAIL_FROM_ADDRESS: z.string().email().optional(),
  // Shown as "<candidate name> via <this>".
  EMAIL_FROM_NAME: z.string().default('Sanad'),
  // Dev safety net: when set, EVERY application email goes here instead of to the company, with the
  // real recipient in the subject. Leave empty only when real sending to companies is intended.
  EMAIL_REDIRECT_TO: z.preprocess((value) => (value === '' ? undefined : value), z.string().email().optional()),

  JOB_PROVIDER: z.enum(['jooble', 'fake']).default('fake'),
  // One key per market: a Jooble key only works on the country site it was registered on (a
  // jooble.org key is US-only). Register each at <eg|sa|ae|de>.jooble.org/api/about. A market without a
  // key is simply not searched.
  JOOBLE_API_KEY_EG: z.string().optional(),
  JOOBLE_API_KEY_SA: z.string().optional(),
  JOOBLE_API_KEY_AE: z.string().optional(),
  JOOBLE_API_KEY_DE: z.string().optional(),
  // Safety margin under Jooble's real 500-lifetime cap, per key (so per country) — the ingestion
  // sweep refuses to call once that country's job_search_calls row count reaches this.
  JOOBLE_MAX_CALLS: z.coerce.number().int().positive().default(450),
  // How long a role group's ingested jobs are considered fresh before it's eligible to be re-fetched.
  JOB_CACHE_TTL_DAYS: z.coerce.number().int().positive().default(30),
});

const envSchemaWithCrossFieldRules = envSchema
  .refine((env) => !env.DEMO_MODE || !!env.EMAIL_REDIRECT_TO, {
    message: 'EMAIL_REDIRECT_TO is required when DEMO_MODE=true; use an inbox you control',
    path: ['EMAIL_REDIRECT_TO'],
  })
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

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const result = envSchemaWithCrossFieldRules.safeParse(config);

  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid environment configuration: ${issues}`);
  }

  return result.data;
}
