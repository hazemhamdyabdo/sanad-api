import { registerAs } from '@nestjs/config';
import { validateEnv } from './env.schema.js';

// Read once, through the same zod schema `app.module.ts` passes as ConfigModule's
// `validate` — so every field here is the coerced/defaulted value that was actually
// validated, not a second, independent read of the raw `process.env` string. Reading
// `process.env.X` directly in each factory (the previous approach) meant a config
// value could silently diverge from what validation checked — e.g. `ai.llmProvider`
// resolving to `undefined` here even though validation had defaulted it to "fake" or
// required a matching AI_API_KEY, letting LlmModule's factory fall through to a wrong
// provider without any error.
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
  sttProvider: env.STT_PROVIDER,
  sttModel: env.STT_MODEL,
}));
