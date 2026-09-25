import 'reflect-metadata';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';
config();
export const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST,
    port: Number(process.env.DATABASE_PORT ?? 5432),
    username: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    ssl: process.env.DATABASE_SSL === 'true',
    synchronize: false,
    entities: ['src/modules/**/entities/*.entity.ts'],
    migrations: ['src/database/migrations/*.ts'],
});
//# sourceMappingURL=data-source.js.map