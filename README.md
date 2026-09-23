<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

# sanad-api

NestJS backend for Sanad (سَنَد). See [`AGENTS.md`](./AGENTS.md) for architecture and working rules, and [`API-CONTRACT.md`](./API-CONTRACT.md) for the endpoint contract shared with the client app.

## Local dev setup: Windows host + WSL2 Docker + phone on LAN

This is the supported dev setup for this repo: **Postgres and pgAdmin run in Docker inside WSL2** (Docker Engine only — no Docker Desktop needed), and **the api runs directly on the Windows host** via `pnpm run start:dev`. Running the api on the host (not in a container) is what lets your phone reach it on your machine's real LAN IP, the same way it reaches the Expo dev server.

Prerequisites:

- WSL2 with a distro that has Docker Engine + the Compose plugin installed and running (`docker compose version` should work from inside it). No Docker Desktop.
- Node + pnpm on Windows.
- If you're also running the app: `sanad-client` cloned as a sibling directory of this repo (`../sanad-client`), and its usual Expo/mobile prerequisites.

### Windows ⇄ WSL2 networking, and why the defaults work

- **API on Windows → Postgres in WSL2**: Docker's published ports inside WSL2 are reachable from Windows via `localhost` — this is WSL2's built-in localhost forwarding (works in both NAT and mirrored networking modes). That's why `.env.example` defaults `DATABASE_HOST=localhost`. If that ever doesn't work on your machine (forwarding disabled, unusual `.wslconfig`), the fallback is your WSL2 VM's own IP: run `wsl hostname -I` and use that instead of `localhost`.
- **Phone → API on Windows**: since the api runs on the host, this is just normal Windows networking — the phone needs your machine's real Wi-Fi/Ethernet LAN IP (see below), not `localhost` and not anything WSL-related.
- **pnpm scripts from a Windows terminal**: there's no `docker` on the Windows PATH in this setup (Docker only exists inside WSL2). The `docker`-related scripts detect this (`process.platform === 'win32'`) and transparently proxy through `wsl.exe` instead, so `pnpm run dev` etc. work the same whether you run them from PowerShell/cmd or from a WSL shell. If you have more than one WSL distribution, set `WSL_DISTRO` in `.env` to the one running Docker; otherwise your WSL default is used.

### Running it from zero

```bash
cp .env.example .env   # adjust ports/passwords if the defaults clash with anything already running
pnpm install
pnpm run dev            # postgres + pgadmin in WSL2 Docker, then the api on this host (foreground)
```

- API: `http://localhost:${PORT}/api/v1` (health check: `GET /api/v1/health`)
- pgAdmin: `http://localhost:${PGADMIN_PORT}` — log in with `PGADMIN_EMAIL` / `PGADMIN_PASSWORD` from `.env`. A "Sanad (docker)" server is pre-configured (host/port/user/db already filled in); its password is your `DATABASE_PASSWORD`.

To also start the mobile app: run `pnpm run dev:app` in a second terminal. It prints the API base URL for all three run targets:

| Running on         | API base URL                            |
| ------------------- | ---------------------------------------- |
| Physical device      | your machine's real LAN IP (printed by `pnpm run lan-ip`) |
| Android emulator     | `http://10.0.2.2:<PORT>/api/v1`          |
| iOS simulator        | `http://localhost:<PORT>/api/v1`         |

**Verifying the phone can actually reach the API:** run `pnpm run lan-ip` and check the address it prints is your real Wi-Fi/Ethernet adapter, not a VPN, mobile-hotspot, or WSL virtual adapter (it filters those out by name, but double-check if in doubt — e.g. `ipconfig` on Windows and match against whichever network your phone is on). Then, with the api running, open that printed URL + `/api/v1/health` in the phone's browser — you should see `{"status":"ok",...}`. If it times out: check Windows Defender Firewall hasn't blocked Node.js on the "Private" network profile (it usually prompts the first time `pnpm run dev` binds the port — allow it), and confirm the phone is on the same Wi-Fi network as the PC.

Other scripts:

```bash
pnpm run dev:api       # backend only: postgres + pgadmin in docker, api on the host (same as `dev`, no Expo)
pnpm run down          # stop the docker db services
pnpm run down:clean    # stop and wipe the postgres volume (asks for confirmation)
pnpm run logs          # follow postgres/pgadmin container logs
pnpm run db:migrate    # run pending migrations (runs on the host, straight against WSL2's postgres)
pnpm run db:revert     # revert the last migration
pnpm run db:reset      # drop + recreate the schema, then re-run migrations (asks for confirmation)
pnpm run db:seed       # run the seed script (no seed data defined yet)
pnpm run db:shell      # psql into the postgres container (via WSL2)
```

`docker-compose.yml` is the base stack and includes an `api` service — that's the shape a future production-style deploy would build on (a built image, no source mount), but it's **not** part of the day-to-day dev flow above; the api always runs on the host in dev. `docker-compose.dev.yml` only adds pgAdmin on top of the base `postgres`.

## Tests, lint, build

```bash
pnpm run test        # unit tests
pnpm run lint         # oxlint
pnpm run build        # nest build
```

## Resources

- [NestJS Documentation](https://docs.nestjs.com)
- [TypeORM Documentation](https://typeorm.io)
