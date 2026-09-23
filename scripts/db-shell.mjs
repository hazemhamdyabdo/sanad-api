import 'dotenv/config';
import { runCompose } from './lib/compose.mjs';

const result = runCompose(['exec', 'postgres', 'psql', '-U', process.env.DATABASE_USER, '-d', process.env.DATABASE_NAME]);
process.exit(result.status ?? 1);
