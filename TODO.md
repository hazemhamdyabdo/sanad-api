# TODO — sanad-api

- `POST /conversations` rejects `mode: "upload"` with `INVALID_REQUEST` for now — wire it once the upload module exists (needs `uploadId` lookup and `missingSections`).
- `ConversationService.deleteSessionAndItsCv` deletes the session and its cv as two separate statements, not one transaction — harmless today because nothing before the (unbuilt) confirm-section endpoint can ever set `session.cvId`, so only one of the two ever actually runs. Make it transactional once confirm-section can set `cvId` for real.
- Add a scheduled cleanup job that deletes `Upload` rows past `expiresAt` and their files on disk — uploaded CVs contain personal data and must not sit around indefinitely.
- The `api` service in the base `docker-compose.yml` is unused and untested in dev (the api runs on the host instead) — verify it actually works when there's a real production deploy path.
- Delete `src/llm-debug.controller.ts` and its registration in `app.module.ts` once the Mistral provider is verified end to end — it's a temporary probe, not part of the real API surface.
- If a failed LLM call needs to reach a client-facing error, wrap it in `AppError('AI_UNAVAILABLE', ...)` at the call site — `integrations/llm` deliberately throws plain errors and stays unaware of the app's error shape.
- Not in scope for phase 1 (see `AGENTS.md`): jobs, matching, applying, tailoring the CV per job, pgvector, n8n, LangGraph, auth, notifications.
