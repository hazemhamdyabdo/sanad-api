import { config } from 'dotenv'; import pg from 'pg';
config({ quiet: true });
const c = new pg.Client({ host: process.env.DATABASE_HOST, port: +process.env.DATABASE_PORT, user: process.env.DATABASE_USER, password: process.env.DATABASE_PASSWORD, database: process.env.DATABASE_NAME });
await c.connect();
for (const q of process.argv.slice(2)) console.log(JSON.stringify((await c.query(q)).rows));
await c.end();
