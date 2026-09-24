import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),

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
});

const envSchemaWithCrossFieldRules = envSchema
  .refine((env) => env.LLM_PROVIDER !== 'mistral' || !!env.AI_API_KEY, {
    message: 'AI_API_KEY is required when LLM_PROVIDER=mistral',
    path: ['AI_API_KEY'],
  })
  .refine((env) => env.STT_PROVIDER !== 'mistral' || !!env.AI_API_KEY, {
    message: 'AI_API_KEY is required when STT_PROVIDER=mistral',
    path: ['AI_API_KEY'],
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
