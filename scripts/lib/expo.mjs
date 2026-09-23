import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { printLanIp } from './lan-ip.mjs';

/** sanad-client is a sibling repo — never read or modify its files, only run its own start script. */
export function startExpo() {
  const clientDir = path.resolve(process.cwd(), '..', 'sanad-client');

  if (!existsSync(clientDir)) {
    console.error(`sanad-client not found at ${clientDir} — clone it as a sibling of sanad-api to use this script.`);
    process.exit(1);
  }

  printLanIp();

  const result = spawnSync('pnpm', ['start'], { cwd: clientDir, stdio: 'inherit', shell: true });
  process.exit(result.status ?? 1);
}
