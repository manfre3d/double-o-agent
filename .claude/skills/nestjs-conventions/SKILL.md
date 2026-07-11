---
name: nestjs-conventions
description: NestJS conventions for apps/control — module layout, DTOs from libs/shared, config/env handling, SSE controller pattern, LLM isolation, testing shape. Use when writing or modifying any backend code.
---

# NestJS Conventions (Control)

> **Scaffold (Phase 1) exists:** root `AppModule` + global `ConfigModule` + the `/api/status` hello-world endpoint. The domain modules below land in Phase 2. Each rule carries its *why*, because Nest is new territory here.

## Module-per-domain layout

```
apps/control/src/
├── app.module.ts       # root: imports the domain modules + ConfigModule
├── missions/           # start/list missions, SSE feed controller
├── agent/              # the agent loop + LlmService
├── gadgets/            # gadget classes + registry (see add-gadget skill)
└── debrief/            # debrief generation & retrieval
```

*Why:* a Nest module is the same idea as an Angular feature area — a folder that owns its controllers (≈ components: they face the outside) and providers (≈ services: they do the work). One domain per module keeps dependency direction visible: `missions` → `agent` → `gadgets`, never backwards.

## DTOs come from `libs/shared`

Controllers accept/return types imported from `@double-o/shared`. Never redeclare a wire type inside Control. *Why:* the compiler then guarantees HQ and Control agree — the whole reason the monorepo exists.

## Config: `@nestjs/config` + `.env`

- Secrets (`OPENAI_API_KEY`, `DATABASE_URL`) live in `.env`, which is **never committed** (already covered by the repo-root `.gitignore`); ship a `.env.example` with dummy values.
- Read config only via injected `ConfigService` — no `process.env` scattered in code. *Why:* one place to validate at boot (fail fast on missing key, not mid-mission).

## The SSE controller pattern

```ts
@Controller('missions')
export class MissionFeedController {
  @Sse(':id/feed')
  feed(@Param('id') id: string): Observable<MessageEvent> {
    return this.missions.eventStream(id).pipe(
      map(ev => ({ type: ev.type, data: ev }) as MessageEvent),
    );
  }
}
```

*Why it's this simple:* Nest's `@Sse()` takes an RxJS `Observable` and handles the HTTP streaming mechanics. The agent loop pushes `MissionEvent`s into a Subject; the controller just maps them out. Event `type` values are the protocol in CLAUDE.md (`briefing`, `thinking`, `gadget_call`, `gadget_result`, `debrief`, `error`).

## LLM isolation

The OpenAI SDK is imported in **exactly one file**: `agent/llm.service.ts`. Everything else (agent loop included) talks to `LlmService`'s own interface (`complete()`, `completeStructured(schema)`). *Why:* provider swaps, retries, token logging, and mocking in tests all become one-file concerns.

## Testing shape

- **Providers**: plain unit tests; instantiate with hand-built fakes (`new MissionService(fakeRepo)`) — Nest's DI doesn't need to boot for logic tests.
- **Controllers**: `Test.createTestingModule` with mocked providers, asserting routing + mapping only.
- **LlmService**: mocked everywhere else; tested itself against recorded responses.
- Name: `*.spec.ts` next to the file under test (same habit as Angular).
