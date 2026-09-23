import 'dotenv/config';
import { runCompose } from './lib/compose.mjs';

const result = runCompose(process.argv.slice(2));
process.exit(result.status ?? 1);
