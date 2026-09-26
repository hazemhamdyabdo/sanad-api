import { spawn, spawnSync } from 'node:child_process';

export const COMPOSE_FILES = ['-f', 'docker-compose.yml', '-f', 'docker-compose.dev.yml'];

function wslDistroArgs() {
  const distro = process.env.WSL_DISTRO;
  return distro ? ['-d', distro] : [];
}

/**
 * Docker Engine runs inside WSL2, not on Windows — there's no `docker` on
 * the Windows PATH. From a Windows terminal we proxy every call through
 * wsl.exe instead; from a WSL/Linux/Mac shell we call docker directly.
 */
export function runCompose(args, opts = {}) {
  const dockerArgs = ['compose', ...COMPOSE_FILES, ...args];

  if (process.platform === 'win32') {
    const wslArgs = ['--cd', process.cwd(), ...wslDistroArgs(), '--', 'docker', ...dockerArgs];
    return spawnSync('wsl.exe', wslArgs, { stdio: 'inherit', ...opts });
  }

  return spawnSync('docker', dockerArgs, { stdio: 'inherit', ...opts });
}

/**
 * WSL2 terminates a distro a few seconds after its last session ends — even with
 * systemd enabled — and the Docker daemon and every container die with it. That is
 * exactly what happens after `docker compose up -d` returns from a Windows terminal:
 * postgres is up for ~10 s, then the api logs `ECONNREFUSED` on every query until
 * the next wsl.exe call boots the distro again.
 *
 * Holding one idle session open for as long as the api runs keeps the distro (and
 * postgres) alive. Returns the child to kill when the api exits, or null off Windows.
 */
export function startWslKeepalive() {
  if (process.platform !== 'win32') {
    return null;
  }
  const child = spawn('wsl.exe', [...wslDistroArgs(), '--', 'sleep', 'infinity'], {
    stdio: 'ignore',
    windowsHide: true,
  });
  child.on('error', () => {});
  return child;
}
