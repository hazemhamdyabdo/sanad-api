import 'dotenv/config';
import { createInterface } from 'node:readline';
import { runCompose } from './lib/compose.mjs';

const rl = createInterface({ input: process.stdin, output: process.stdout });

rl.question('This stops everything and deletes the Postgres volume — all local data is lost. Type "yes" to continue: ', (answer) => {
  rl.close();
  if (answer.trim().toLowerCase() !== 'yes') {
    console.log('Cancelled.');
    return;
  }
  const result = runCompose(['down', '-v']);
  process.exit(result.status ?? 1);
});
