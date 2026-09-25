import { AppDataSource } from './data-source.js';
async function seed() {
    await AppDataSource.initialize();
    console.log('No seed data defined yet.');
    await AppDataSource.destroy();
}
await seed();
//# sourceMappingURL=seed.js.map