import { spawnSync } from 'node:child_process';
import { runCompose, startWslKeepalive } from './compose.mjs';

/** Brings up postgres + pgadmin in docker, then runs the api dev server on the host (foreground). */
export function startBackend() {
  const up = runCompose(['up', '-d', 'postgres', 'pgadmin']);
  if (up.status !== 0) {
    process.exit(up.status ?? 1);
  }

  // Keep the WSL2 distro — and with it the Docker daemon and postgres — alive while the api runs.
  const keepalive = startWslKeepalive();

  const result = spawnSync('pnpm', ['run', 'start:dev'], { stdio: 'inherit', shell: true });
  keepalive?.kill();
  process.exit(result.status ?? 1);
}
