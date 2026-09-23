# TODO — sanad-api

- Wire `DeviceGuard` to actually resolve (and create, if missing) the `Device` row now that the `Device` entity exists, and have `@CurrentDevice()` return that row instead of the raw id string.
- Add a scheduled cleanup job that deletes `Upload` rows past `expiresAt` and their files on disk — uploaded CVs contain personal data and must not sit around indefinitely.
- Not in scope for phase 1 (see `AGENTS.md`): jobs, matching, applying, tailoring the CV per job, pgvector, n8n, LangGraph, auth, notifications.
