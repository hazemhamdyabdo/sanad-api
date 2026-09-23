# TODO — sanad-api

- Wire `DeviceGuard` to actually resolve (and create, if missing) the `Device` row once the `Device` entity lands, and have `@CurrentDevice()` return that row instead of the raw id string.
- Not in scope for phase 1 (see `AGENTS.md`): jobs, matching, applying, tailoring the CV per job, pgvector, n8n, LangGraph, auth, notifications.
