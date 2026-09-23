import { spawnSync } from 'node:child_process';

export const COMPOSE_FILES = ['-f', 'docker-compose.yml', '-f', 'docker-compose.dev.yml'];

/**
 * Docker Engine runs inside WSL2, not on Windows — there's no `docker` on
 * the Windows PATH. From a Windows terminal we proxy every call through
 * wsl.exe instead; from a WSL/Linux/Mac shell we call docker directly.
 */
export function runCompose(args, opts = {}) {
  const dockerArgs = ['compose', ...COMPOSE_FILES, ...args];

  if (process.platform === 'win32') {
    const distro = process.env.WSL_DISTRO;
    const wslArgs = ['--cd', process.cwd(), ...(distro ? ['-d', distro] : []), '--', 'docker', ...dockerArgs];
    return spawnSync('wsl.exe', wslArgs, { stdio: 'inherit', ...opts });
  }

  return spawnSync('docker', dockerArgs, { stdio: 'inherit', ...opts });
}
