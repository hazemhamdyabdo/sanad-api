# TODO — sanad-api

- `DeviceGuard`'s DB-lookup branch (the non-`@Public()`/non-`@SkipDeviceLookup()` path, which resolves the header to a `Device` row for `@CurrentDevice()`) has no route exercising it yet — `/health` is `@Public()` and `/devices` is `@SkipDeviceLookup()`. Sanity-check it against a real request once the next endpoint (conversation) uses `@CurrentDevice()`.
- Add a scheduled cleanup job that deletes `Upload` rows past `expiresAt` and their files on disk — uploaded CVs contain personal data and must not sit around indefinitely.
- The `api` service in the base `docker-compose.yml` is unused and untested in dev (the api runs on the host instead) — verify it actually works when there's a real production deploy path.
- Not in scope for phase 1 (see `AGENTS.md`): jobs, matching, applying, tailoring the CV per job, pgvector, n8n, LangGraph, auth, notifications.
