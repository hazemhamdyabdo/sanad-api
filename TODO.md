# TODO — sanad-api

- `POST /conversations` rejects `mode: "upload"` with `INVALID_REQUEST` for now — wire it once the upload module exists (needs `uploadId` lookup and `missingSections`).
- `ConversationService.deleteSessionAndItsCv` deletes the session and its cv as two separate statements, not one transaction — harmless today because nothing before the (unbuilt) confirm-section endpoint can ever set `session.cvId`, so only one of the two ever actually runs. Make it transactional once confirm-section can set `cvId` for real.
- Add a scheduled cleanup job that deletes `Upload` rows past `expiresAt` and their files on disk — uploaded CVs contain personal data and must not sit around indefinitely.
- The `api` service in the base `docker-compose.yml` is unused and untested in dev (the api runs on the host instead) — verify it actually works when there's a real production deploy path.
- Delete `src/llm-debug.controller.ts` and its registration in `app.module.ts` once the Mistral provider is verified end to end — it's a temporary probe, not part of the real API surface.
- If a failed LLM call needs to reach a client-facing error, wrap it in `AppError('AI_UNAVAILABLE', ...)` at the call site — `integrations/llm` deliberately throws plain errors and stays unaware of the app's error shape.
- `POST /conversations/:sessionId/messages` doesn't update `session.sections`/`currentSection` at all yet (status stays `pending`, current section never advances) — that transition belongs to the confirm-section endpoint, not yet built.
- `sectionReplySchema`'s `card` is an unvalidated open-ended record — real per-section shapes (experience entries vs. education vs. skills, etc.) are a later prompt/schema design task, not part of the SSE plumbing.
- `message_end`'s `quickReplies` is always `null` — nothing generates it yet; `sectionReplySchema` doesn't have a field for it either.
- `FakeLlmProvider` reads `current_section: <id>` out of the system prompt via a small regex — a real, non-fake model would just read the same line as an ordinary instruction, so this isn't fake-specific coupling, but it does mean the exact prompt wording in `ai/prompts/section-reply.prompt.ts` and the fake provider's parsing must stay in sync if that line's format ever changes.
- Not in scope for phase 1 (see `AGENTS.md`): jobs, matching, applying, tailoring the CV per job, pgvector, n8n, LangGraph, auth, notifications.
