import 'dotenv/config';
import { createInterface } from 'node:readline';
import { spawnSync } from 'node:child_process';
import { Client } from 'pg';

const rl = createInterface({ input: process.stdin, output: process.stdout });

rl.question(`This drops and recreates the "${process.env.DATABASE_NAME}" schema, then re-runs migrations. Type "yes" to continue: `, async (answer) => {
  rl.close();
  if (answer.trim().toLowerCase() !== 'yes') {
    console.log('Cancelled.');
    return;
  }

  const client = new Client({
    host: process.env.DATABASE_HOST,
    port: Number(process.env.DATABASE_PORT),
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
  });
  await client.connect();
  await client.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
  await client.end();

  const migrate = spawnSync('pnpm', ['run', 'migration:run'], { stdio: 'inherit', shell: true });
  process.exit(migrate.status ?? 1);
});
