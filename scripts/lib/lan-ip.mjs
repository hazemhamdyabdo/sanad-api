import os from 'node:os';

// Virtual adapters (mobile hotspot, WSL, VPNs, hypervisors) show up as
// non-internal IPv4 addresses too but aren't reachable from a phone on the
// same Wi-Fi — exclude them by adapter name rather than guessing from IP
// ranges alone.
const EXCLUDE_NAME_PATTERN = /virtual|vEthernet|loopback|vmware|virtualbox|tailscale|hyper-v|bluetooth|local area connection\*|wsl/i;
const PREFERRED_NAME_PATTERN = /^(wi-?fi|ethernet)/i;

function getLanCandidates() {
  const candidates = [];
  for (const [name, addresses] of Object.entries(os.networkInterfaces())) {
    if (EXCLUDE_NAME_PATTERN.test(name)) continue;
    for (const net of addresses ?? []) {
      if (net.family === 'IPv4' && !net.internal) {
        candidates.push({ name, address: net.address });
      }
    }
  }
  return candidates;
}

export function printLanIp() {
  const port = process.env.PORT ?? '3000';
  const candidates = getLanCandidates();
  const preferred = candidates.find((c) => PREFERRED_NAME_PATTERN.test(c.name)) ?? candidates[0];

  console.log('\nAPI base URL — pick the one matching how the app is running:');

  if (!preferred) {
    console.log('  Physical device (same Wi-Fi network): <no LAN IP found — check your network adapter>');
  } else {
    console.log(`  Physical device (same Wi-Fi network): http://${preferred.address}:${port}/api/v1  (${preferred.name})`);
    const others = candidates.filter((c) => c !== preferred);
    if (others.length > 0) {
      console.log("  Other adapters found on this machine — try one of these instead if the above doesn't work:");
      for (const c of others) {
        console.log(`    http://${c.address}:${port}/api/v1  (${c.name})`);
      }
    }
  }

  console.log(`  Android emulator:                     http://10.0.2.2:${port}/api/v1`);
  console.log(`  iOS simulator:                         http://localhost:${port}/api/v1\n`);
}
