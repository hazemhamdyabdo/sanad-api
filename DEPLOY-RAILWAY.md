# Deploy the Sanad API demo on Railway

Use Railway for this demo: one Docker API service and one PostgreSQL 17 + pgvector service, each with its own volume. No Redis or separate worker is required by the current code. This guide deploys a fresh demo database; it does not upload your local database, CVs, or secrets.

Railway's default Postgres template does **not** bundle pgvector. Railway describes these database templates as unmanaged: it provides the hosting, but you own configuration and maintenance. Use the upstream `pgvector/pgvector:0.8.6-pg17-bookworm` image below; there is no need to build our local Postgres Dockerfile. The existing `AddJobMatching` migration enables `vector` automatically. [Railway Postgres](https://docs.railway.com/databases/postgresql), [upstream image tags](https://github.com/pgvector/pgvector#docker).

## Do these steps in order

1. **Prepare the repository on GitHub.** This checkout's Git root is `sanad-api`, not the parent `Sanad` folder. Review and commit the intended API work, including the new migrations, email/embedding/application modules, `railway.json`, Dockerfile and deployment changes, then push to your own private GitHub repository. There is substantial existing uncommitted work: committing only `railway.json` will not deploy the current app. Do not blindly add every file: `tmp/` contains local probe files and PDFs. Never commit `.env`, uploads or outbox data. Run `pnpm run lint`, `pnpm exec tsc --noEmit -p tsconfig.build.json`, and `pnpm run build` from `sanad-api` first.

2. **Create an empty Railway project**, e.g. `sanad-demo`, and choose a plan that supports the two persistent services and volumes. Review the displayed charges and set a usage alert/budget in Railway. Use one region for both services. Keep Serverless/sleep disabled: background ingestion and application recovery use process timers.

3. **Create the database service.** In the project choose **New → Docker Image**, enter `pgvector/pgvector:0.8.6-pg17-bookworm`, and name the service exactly **Postgres**. Set its Variables before the successful first deployment:

   | Database variable | Value |
   | --- | --- |
   | `POSTGRES_USER` | `sanad_demo` |
   | `POSTGRES_PASSWORD` | A new long random password from your password manager; never local `sanad` |
   | `POSTGRES_DB` | `sanad_demo` |
   | `PGDATA` | `/var/lib/postgresql/data/pgdata` |

   Attach a Railway **Volume** to **Postgres**, mounted at `/var/lib/postgresql/data`. The `pgdata` subdirectory avoids initializing Postgres directly in a nonempty volume root. Leave the image's start command unchanged. Apply/deploy and wait for `database system is ready to accept connections` in its logs. An initial failure before variables are entered is harmless; redeploy once configured. Do not add an HTTP domain or TCP public proxy; the API uses private networking. Keep this service on PostgreSQL 17 for the demo; changing the image to another major version is not a database upgrade procedure.

4. **Create the API service** with **New → GitHub Repo**, authorize Railway to access your private API repository, select the pushed branch, and name the service **sanad-api**. An initial deployment may fail until the remaining settings are entered. For this separate API repo, Root Directory is `/` and config file is `/railway.json`. If you later put both projects in one Git repository, use Root Directory `/sanad-api` and explicitly set the config file to `/sanad-api/railway.json`. [Root directory and config path rules](https://docs.railway.com/deployments/monorepo).

5. **Attach the API volume** to **sanad-api**, mounted at **`/data`**. This is a second volume, separate from Postgres. Do not mount over `/app`: that would hide the application code. Keep one replica. The current image runs as root, so no `RAILWAY_RUN_UID` override is needed. The two storage variables below put uploads and outbox PDFs on the same volume.

6. **Set API variables.** Open **sanad-api → Variables → Raw Editor**, paste `.env.railway.example`, and replace `EMAIL_REDIRECT_TO` with an inbox you personally control. Do not deploy the example address. Leave `DEMO_MODE=true` throughout the demo. Start with all providers `fake` for a no-cost infrastructure check. For a real conversational/voice/matching demo, add a demo-scoped `AI_API_KEY`, then change `LLM_PROVIDER`, `STT_PROVIDER`, and `EMBEDDING_PROVIDER` to `mistral` **before creating demo data**. Leave `JOB_PROVIDER=fake` unless you intentionally want real listings. For actual email delivery to your own inbox, follow the optional email settings below. Keep the redirect even with fake email.

7. **Review Settings, then deploy.** `railway.json` selects the Dockerfile, compiled migration command, `node dist/main.js`, `/api/v1/health`, and one replica. Do not replace these with `pnpm dev`, Compose, or `nest deploy`. Leave `PORT` unset so Railway supplies it. Apply all pending changes. In deployment logs, check migrations succeeded before startup and the email provider reports **REDIRECTED**. A migration failure blocks that deployment; correct its cause and redeploy. Migrations use the private network and require a ready database. [Railway pre-deploy behavior](https://docs.railway.com/deployments/pre-deploy-command).

8. **Generate the public API URL.** In **sanad-api → Settings → Networking → Public Networking**, choose **Generate Domain**. Route it to the app's `PORT` (the port shown in deployment logs). Open `https://YOUR-DOMAIN/api/v1/health`; expect HTTP 200. Use HTTPS for the client. Postgres stays private.

9. **Point the mobile client at that URL.** Replace its local/LAN API base URL with `https://YOUR-DOMAIN/api/v1` (or the origin if its client adds `/api/v1` itself). Restart/rebuild the client as needed for its environment settings; ensure mock mode is off. Register the device against the new database before other requests. No client files were changed by this deployment work.

10. **Run the smoke checks below**, then perform the real demo flow from the phone: conversation with SSE, upload a disposable CV, poll analysis to completion, export/open the PDF, choose a supported role/country, wait for job ingestion/matches, then submit one email application. Fake job external links are placeholders. With Resend enabled, verify the message arrives only at your redirect inbox. With fake email, inspect `/data/outbox` inside the API container; the files are not publicly served.

11. **Verify persistence before demo day.** Finish all active uploads/applications. In the API service's Railway SSH session run `node -e "require('node:fs').writeFileSync('/data/persistence-check.txt','sanad-demo')"`. Redeploy, reconnect, and run `node -e "console.log(require('node:fs').readFileSync('/data/persistence-check.txt','utf8'))"`; expect `sanad-demo`. Confirm the same device/CV and completed application are still available and PDFs can be downloaded. A successfully analyzed upload is deliberately deleted, so it is not a persistence test. Enable volume backups for both services through Railway's volume settings; take a backup before later schema changes.

## Every API environment variable

`.env.railway.example` is a safe starting template, not a copy of `.env`. Values with `${{...}}` are Railway references, entered literally in its Variables editor. If you rename the database service, update the `Postgres` prefix.

| Variable | Demo value / action |
| --- | --- |
| `NODE_ENV` | `production`; disables public LLM debug routes |
| `PORT` | Omit; Railway supplies it |
| `DEMO_MODE` | `true`; startup fails if redirect is missing/empty |
| `EMAIL_REDIRECT_TO` | Your controlled inbox; mandatory for this demo, never a company address |
| `UPLOAD_DIR` | `/data/uploads` |
| `EMAIL_OUTBOX_DIR` | `/data/outbox` |
| `DATABASE_HOST` | `${{Postgres.RAILWAY_PRIVATE_DOMAIN}}` |
| `DATABASE_PORT` | `5432` internal port |
| `DATABASE_USER` | `${{Postgres.POSTGRES_USER}}` |
| `DATABASE_PASSWORD` | `${{Postgres.POSTGRES_PASSWORD}}` |
| `DATABASE_NAME` | `${{Postgres.POSTGRES_DB}}` |
| `DATABASE_SSL` | `false` for this pgvector image over Railway private networking; it does not configure TLS. Reassess if switching DB provider; do not expose this connection publicly |
| `LLM_PROVIDER` | `fake` initially, `mistral` for real conversation/CV analysis |
| `STT_PROVIDER` | `fake` initially, `mistral` for real transcription |
| `EMBEDDING_PROVIDER` | `fake` initially, `mistral` for semantic matching |
| `AI_API_KEY` | Omit with all AI providers fake; required when any is `mistral`. Prefer a separate demo key |
| `AI_MODEL` | `mistral-small-latest` |
| `AI_EXTRACTION_MODEL` | `mistral-medium-latest` |
| `STT_MODEL` | `voxtral-mini-latest` |
| `EMBEDDING_MODEL` | `mistral-embed`; stored vectors have 1024 dimensions |
| `EMAIL_PROVIDER` | `fake` writes outbox/PDFs without sending; optionally `resend` |
| `RESEND_API_KEY` | Omit for fake; required for Resend; use a demo-scoped sending key |
| `EMAIL_FROM_ADDRESS` | Omit entirely for fake, **do not set an empty string**. For Resend use an authorized sender on your verified domain, or `onboarding@resend.dev` with the redirect set to your Resend account email |
| `EMAIL_FROM_NAME` | `Sanad` |
| `JOB_PROVIDER` | `fake` recommended for demo; optionally `jooble` |
| `JOOBLE_API_KEY_EG` | Omit for fake; Egypt key if using Jooble for Egypt |
| `JOOBLE_API_KEY_SA` | Omit unless using Saudi Jooble listings |
| `JOOBLE_API_KEY_AE` | Omit unless using UAE Jooble listings |
| `JOOBLE_API_KEY_DE` | Omit unless using German Jooble listings |
| `JOOBLE_MAX_CALLS` | `450` with fake; for real Jooble, set to a conservative remaining budget for that key, accounting for local usage |
| `JOB_CACHE_TTL_DAYS` | `30` |

Do **not** bulk-import local `.env`. Specifically:

- Replace all local database settings (`localhost`, `postgres`, local credentials and database name) with the references above. `DATABASE_URL` is **not read by this application**; setting only it will not work.
- Do not copy `NODE_ENV=development`, a local fixed `PORT`, Windows paths, or relative storage paths.
- Do not copy `PGADMIN_PORT`, `PGADMIN_EMAIL`, `PGADMIN_PASSWORD`, or `WSL_DISTRO`; they only support the local tools. Do not deploy pgAdmin for this demo.
- Never copy a blank redirect, a real-company redirect, or disable `DEMO_MODE`. A valid email is only a syntax check: you must verify ownership of the inbox yourself.
- API keys can technically be reused, but enter them intentionally through Railway rather than committing or importing everything. Prefer separate demo keys. Existing Jooble keys may already have consumed their allowance: the fresh cloud database has no record of local usage, so its counter cannot protect the shared remaining balance. Keep fake jobs for the demo to avoid this issue.
- Do not import lowercase/misspelled or unrelated variables; names are case sensitive. The table above is the full application schema.

Railway supplies `RAILWAY_*` metadata; none needs manual setting for this setup. Database-service variables are the four in step 3; API variables belong to the API service, not Postgres.

## Smoke checks from Windows PowerShell

Use a disposable device and no private CV data during setup:

```powershell
$demoApi = 'https://YOUR-DOMAIN/api/v1'
Invoke-RestMethod "$demoApi/health"
$demoDevice = [guid]::NewGuid().ToString()
$demoHeaders = @{ 'X-Device-Id' = $demoDevice }
$demoBody = @{ platform = 'android'; appVersion = '1.0.0'; locale = 'ar-EG'; region = 'EG' } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri "$demoApi/devices" -Headers $demoHeaders -ContentType 'application/json' -Body $demoBody
```

The health endpoint checks that the app is running; device registration exercises a real database write. For the remaining flows, use `requests.http` with its `baseUrl` replaced by the HTTPS base and its device ID replaced by your disposable ID, or use the phone. Complete/poll async operations before redeploying. With a registered device ID, `GET /api/v1/_debug/llm` should return 404 in production.

To inspect extension/migration state, open an SSH session **inside Postgres** using Railway's SSH action/CLI and run:

```sh
psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT extversion FROM pg_extension WHERE extname = 'vector';"
psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c 'SELECT name FROM migrations ORDER BY id;'
```

The first query should return one version row after the API pre-deploy step. No rows means the matching migration has not run. `extension vector is not available` means you chose an image without pgvector. `ENOTFOUND` means check the private host/service reference and project/environment. `ECONNREFUSED` means wait for Postgres readiness and confirm port 5432. Do not try Railway private hostnames from your laptop: `railway run` runs locally; use SSH for commands that need the private network.

Jobs ingest on demand after a supported CV role/preferences requests matches, using a 60-second sweep. If you want to prewarm fake jobs, with **JOB_PROVIDER=fake** run `node dist/modules/jobs/seed-job-roles.js` once in an API SSH session. This uses the configured embedding provider and may spend AI credits. Do not add it to each deployment. `db:seed` currently seeds nothing.

## What changes or breaks outside local development

| Local assumption | Deployed behavior / action |
| --- | --- |
| Compose starts the database and waits for health | Railway does not run this Compose stack. Create two services, wait for Postgres, then deploy API. No pgAdmin is deployed |
| Local DB and existing device registrations already exist | Cloud DB starts empty. Re-register devices and create demo CVs; local jobs/caches do not transfer |
| Disk files survive | Only `/data` and the separate DB volume persist. Uploads/outbox use `/data`; other writes disappear on deploy |
| Generated PDFs must be stored as files | CV export and tailored application downloads are rendered in memory from DB records (`tailoredCv` is stored on the application). Their durable source is Postgres. Fake email attachments are real files and persist in `/data/outbox`; there is no separate PDF file cache to mount |
| A volume keeps all uploaded CVs forever | Upload source files are intentionally deleted after analysis, including failure; expired upload rows/files are swept. The volume protects pending files only, not an archive |
| A background upload always completes | Upload analysis is in-process and has no restart recovery. A deploy/crash can leave it processing until expiry; re-upload. Persistence alone does not resume work |
| SSE continues through a restart | Active streams disconnect. Reconnect/resume through the client; deploy between demonstrations |
| Add replicas for reliability | Current matching locks and job/application timers are not designed for multiple instances. Keep one instance; application recovery periodically resumes stale work. Volume deployments also have a short interruption |
| A sleeping service can run scheduled work | Disable Serverless/sleep to keep ingestion, cleanup and recovery sweeps running |
| Browser and phone networking are identical | Native mobile uses HTTPS without browser CORS. Browser/Expo Web cross-origin calls currently fail because CORS is not enabled; configure an explicit allowed web origin before offering a web demo |
| localhost/LAN addresses work on the phone remotely | They do not point to Railway. Set the deployed HTTPS base URL and disable client mock mode |
| Development debug endpoints are available | `_debug/llm` routes are disabled in production by this change |
| Local fake providers demonstrate real integrations | Fake AI returns canned data, fake STT a fixed line, fake email sends nothing, and fake jobs use placeholder links. Select real AI explicitly for a real AI demo |
| Switching embeddings is harmless | Choose the provider/model before creating demo data; stored job/CV vectors and match caches must be regenerated consistently when switching, even if dimensions match |
| API rollback rolls back data | It does not undo migrations. Prefer backward-compatible migrations, backup first, and fix forward; never run `db:reset` on Railway |

This remains a limited-access demo: `X-Device-Id` is an identifier, not authentication, and device registration is public. The current API has no rate limiting; anyone with the URL can register and spend provider quota. Share with intended demo participants and use disposable data and capped provider budgets. PDF rendering also currently strips non-ASCII characters; Arabic PDF text is a pre-existing renderer limitation, not a hosting failure.

The Docker image excludes `.env*`, uploads and `tmp` so local secrets/CVs/outbox files are not baked in. It deliberately retains build/CLI dependencies for this first deployment. No new package dependencies were added.

## Deployment mechanics and later changes

Railway runs `node node_modules/typeorm/cli.js migration:run -d dist/database/data-source.js` after build, before API startup. The data source now discovers compiled JS migrations/entities in `dist`; local TS migration commands continue to work. TypeORM tracks applied migrations; repeat deploys apply only new ones. `synchronize` remains false. The migration container does not boot the app or use its file volume. [Pre-deploy commands](https://docs.railway.com/deployments/pre-deploy-command).

Volumes mount only at runtime. Volume-attached services cannot use replicas and incur a short interruption on redeploy. For a demo, one API volume is simpler than adding object storage. Later, moving uploads to an S3-compatible storage provider and background tasks to durable workers would remove these constraints. [Volume behavior](https://docs.railway.com/volumes), [volume limitations](https://docs.railway.com/volumes/reference).

Push new reviewed commits to the connected branch to redeploy automatically. Avoid overlapping manual deployments/migrations. Never delete a volume to fix a failed migration: inspect logs and take a backup. Changing `POSTGRES_PASSWORD` in Variables after initialization does not rotate the existing database role password; that needs a database password change too.

Prepared and statically checked locally; no Railway account resources were created and no cloud deployment has yet been verified. Complete the live smoke and persistence checks above before presenting.
