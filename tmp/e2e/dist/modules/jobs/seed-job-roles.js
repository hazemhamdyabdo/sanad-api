import 'reflect-metadata';
import { config } from 'dotenv';
config();
const { NestFactory } = await import('@nestjs/core');
const { AppModule } = await import('../../app.module.js');
const { JobIngestionService } = await import('./job-ingestion.service.js');
const { JobsService } = await import('./jobs.service.js');
const SEED_ROLE_CODES = [
    'frontend_developer',
    'backend_developer',
    'fullstack_developer',
    'mobile_developer',
    'accountant',
    'accounts_assistant',
    'sales_representative',
    'retail_cashier',
    'store_manager',
    'cook',
    'waiter',
    'barista',
    'hotel_receptionist',
];
async function main() {
    const app = await NestFactory.createApplicationContext(AppModule, { logger: ['log', 'warn', 'error'] });
    const jobsService = app.get(JobsService);
    const jobIngestionService = app.get(JobIngestionService);
    for (const roleCode of SEED_ROLE_CODES) {
        await jobsService.ensureRoleIngested(roleCode, 'EG');
    }
    console.log(`Queued ${SEED_ROLE_CODES.length} role(s) across 4 groups (Egypt). Running the ingestion sweep now...`);
    for (let i = 0; i < 10; i++) {
        await jobIngestionService.runSweepOnce();
    }
    console.log('Done. Check the `jobs`, `role_ingestion_cache`, and `job_search_calls` tables.');
    await app.close();
}
await main();
//# sourceMappingURL=seed-job-roles.js.map