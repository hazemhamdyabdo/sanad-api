import { registerAs } from '@nestjs/config';
import type { Env } from './env.schema.js';

export const appConfig = registerAs('app', () => ({
  env: process.env.NODE_ENV as Env['NODE_ENV'],
  port: Number(process.env.PORT),
}));

export const databaseConfig = registerAs('database', () => ({
  host: process.env.DATABASE_HOST,
  port: Number(process.env.DATABASE_PORT),
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  ssl: process.env.DATABASE_SSL === 'true',
}));
