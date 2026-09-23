import { spawnSync } from 'node:child_process';
import { runCompose } from './compose.mjs';

/** Brings up postgres + pgadmin in docker, then runs the api dev server on the host (foreground). */
export function startBackend() {
  const up = runCompose(['up', '-d', 'postgres', 'pgadmin']);
  if (up.status !== 0) {
    process.exit(up.status ?? 1);
  }

  const result = spawnSync('pnpm', ['run', 'start:dev'], { stdio: 'inherit', shell: true });
  process.exit(result.status ?? 1);
}
