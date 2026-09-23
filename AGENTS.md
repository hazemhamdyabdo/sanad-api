# AGENTS.md — sanad-api

NestJS backend for Sanad (سَنَد): an app that builds an ATS-friendly CV from a conversation in Egyptian Arabic, then matches jobs and applies to them.

## Related repo

The Expo mobile app lives in a separate repo (`sanad-client`). This repo is backend only — never assume you can read or change the app's code.

`API-CONTRACT.md` is the single source of truth for every endpoint, and an identical copy lives in the client repo. **The app is already built against it with mock data**, so the backend must match it exactly. If something in the contract looks wrong or impossible, say so and stop — never change the shape on your own.

## Scope — phase 1

Device registration, conversation (SSE), CV built section by section, CV upload and parsing, CV read/update, PDF export.

**Not in scope yet** (see `TODO.md`): jobs, matching, applying, tailoring the CV per job, pgvector, n8n, LangGraph, auth, notifications.

## Key decisions

- **No login.** Every request carries `X-Device-Id`. A guard resolves it to a `Device` row and attaches it to the request. Everything is scoped by device.
- **The conversation lives in the backend.** It holds every message, AI and user. The client never replays history.
- **Replies stream over SSE.** Text streams token by token; structured cards are sent as one complete event.
- **The CV is built section by section.** Each section is confirmed by the user, then saved. The backend tells the client which sections are still missing; the last one carries a final flag.
- **Resumable.** A returning device gets back where it stopped, and can either continue or wipe and start over.
- **AI behind an interface.** Providers (LLM, speech-to-text) are chosen later; code depends on an interface, never on a vendor SDK, so swapping is a one-file change.
- **Fail visibly, in Arabic.** Every error goes through the shared error shape with an Egyptian Arabic `message`, because the app shows it to the user as is.

## Stack

- NestJS + TypeScript (strict)
- PostgreSQL + **TypeORM** (`@nestjs/typeorm`)
- `class-validator` / `class-transformer` for request DTOs
- `zod` to validate anything coming back from an LLM before trusting it
- HTML → PDF renderer producing real text, never an image

Ask before adding any other dependency.

### TypeORM rules

- **`synchronize: false` always**, in every environment. Schema changes happen only through migrations, committed to the repo.
- Entities live in their own module under `entities/`. One entity per file.
- Only a module's repository touches TypeORM, and only for its own entities. No `getRepository` calls in services or controllers.
- Query builder results and raw queries must be mapped to an explicit typed DTO — never returned as `any`.
- Use transactions where more than one table changes together (e.g. confirming a section writes both the CV section and the session state).
- Never enable eager relations globally; load what you need explicitly.

## Structure

```
src/
├── main.ts
├── app.module.ts
│
├── config/                     # env schema + typed config, validated at boot
│
├── common/                     # cross-cutting, no business logic
│   ├── guards/                 # DeviceGuard
│   ├── decorators/             # @CurrentDevice()
│   ├── filters/                # global error filter → contract error shape
│   ├── interceptors/           # logging, timeouts
│   ├── errors/                 # AppError + the contract's error codes
│   ├── sse/                    # SSE helpers (event shapes, heartbeats)
│   └── types/
│
├── database/                   # TypeORM module, data source, migrations
│   ├── migrations/
│   └── data-source.ts
│
├── integrations/               # everything talking to the outside world
│   ├── llm/
│   │   ├── llm.interface.ts    # the port the app depends on
│   │   ├── providers/          # one file per vendor
│   │   └── llm.module.ts       # binds the interface to the configured provider
│   ├── stt/                    # same shape: interface + providers
│   ├── storage/                # local now, S3-compatible later
│   └── pdf/
│
├── ai/                         # the ONLY place that builds prompts
│   ├── prompts/                # one file per prompt, versioned
│   ├── schemas/                # zod schemas for every AI output
│   └── services/               # e.g. cv-extraction, section-writer
│
└── modules/                    # business modules, mirroring the app's domains
    ├── device/
    ├── conversation/
    ├── cv/
    └── upload/
```

Every module follows the same internal shape:

```
modules/<name>/
├── <name>.module.ts
├── <name>.controller.ts        # thin: validate → service → DTO
├── <name>.service.ts           # business logic
├── <name>.repository.ts        # the only place touching TypeORM for this module
├── entities/                   # TypeORM entities owned by this module
├── dto/                        # request DTOs + response DTOs shaped by the contract
└── index.ts                    # the module's public API
```

## Architecture rules

These are what keep it scalable when jobs, applications, and notifications land later:

- **A module is reached only through its `index.ts`** — never import another module's service, repository, or entities directly.
- **Only `ai/` builds prompts, only `integrations/` calls the outside world.** A business module asks for a typed result and never sees a vendor SDK, an HTTP client, or a raw model response.
- **Every AI output is validated with zod before use.** Never trust it, never pass it straight to the client.
- **Controllers are thin.** No business logic, no ORM, no prompt building.
- **Response DTOs are written from the contract**, not from entities. Never leak an entity to the client.
- **Nothing vendor-specific in business code.** If a class name contains a vendor's name outside `integrations/`, it's in the wrong place.
- **New capability = new module**, same shape as the others. Do not grow an existing module sideways.
- API is versioned under `/api/v1`. Breaking a response shape means a new version, not an edit.

## Working rules

- **One endpoint at a time.** Build it, test it with a real request, stop for review before the next one.
- **Test before claiming it works.** Keep runnable requests in `requests.http` in the repo.
- Run lint and typecheck before declaring any task done.
- Never log CVs, audio, phone numbers, or emails.
- Secrets in `.env` only, with `.env.example` kept current. Never commit a key.
- When we agree to postpone something, add a one-line item to `TODO.md`.