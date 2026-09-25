import 'reflect-metadata';
import { config } from 'dotenv';

// Must run before AppModule (and its transitive `config/configuration.ts`, which reads
// `process.env` at module-load time) is ever imported — a plain top-level `import` of AppModule
// would be hoisted above this call, so the rest of the imports are dynamic, deliberately.
config();

const { NestFactory } = await import('@nestjs/core');
const { AppModule } = await import('../../app.module.js');
const { JobIngestionService } = await import('./job-ingestion.service.js');
const { JobsService } = await import('./jobs.service.js');

/**
 * Dev-time seed data only — NOT the real trigger path. The real path is whatever reacts to a CV
 * analysis or a preferences change calling `JobsService.ensureRoleIngested` (not built yet); this
 * script calls the exact same method, just for a fixed starter set, so there's something in the
 * `jobs` table to build and test matching against.
 *
 * Seeds only 4 of the 26 groups (Egypt only) — enough to develop against without spending the whole
 * budget on groups nothing has asked for yet. Everything else ingests on demand, later, for real.
 *
 * Uses whatever JOB_PROVIDER is configured — leave it at "fake" (the default) until deliberately
 * ready to spend real Jooble calls.
 */
const SEED_ROLE_CODES = [
  // Software Development
  'frontend_developer',
  'backend_developer',
  'fullstack_developer',
  'mobile_developer',
  // Accounting & Finance
  'accountant',
  'accounts_assistant',
  // Sales & Retail
  'sales_representative',
  'retail_cashier',
  'store_manager',
  // Hospitality & Food Service
  'cook',
  'waiter',
  'barista',
  'hotel_receptionist',
];

async function main(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['log', 'warn', 'error'] });
  const jobsService = app.get(JobsService);
  const jobIngestionService = app.get(JobIngestionService);

  for (const roleCode of SEED_ROLE_CODES) {
    await jobsService.ensureRoleIngested(roleCode, 'EG');
  }

  console.log(`Queued ${SEED_ROLE_CODES.length} role(s) across 4 groups (Egypt). Running the ingestion sweep now...`);

  // One pass per BATCH_SIZE-sized chunk of groups — 4 distinct groups here, comfortably one pass,
  // but looped defensively in case that constant ever shrinks.
  for (let i = 0; i < 10; i++) {
    await jobIngestionService.runSweepOnce();
  }

  console.log('Done. Check the `jobs`, `role_ingestion_cache`, and `job_search_calls` tables.');
  await app.close();
}

await main();
