import { AppDataSource } from './data-source.js';

/**
 * Nothing to seed yet — phase 1 has no static reference data, everything is
 * user-generated (devices, CVs, uploads). Kept as a ready entry point for
 * when that changes.
 */
async function seed(): Promise<void> {
  await AppDataSource.initialize();
  console.log('No seed data defined yet.');
  await AppDataSource.destroy();
}

await seed();
