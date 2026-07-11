# CLAUDE.md

> **Status: Phase 4 (spy-noir polish) complete — gun-barrel intro, typewriter feed, dossier cards, TOP SECRET stamps, redaction reveals; self-hosted fonts, tokens + mixins, reduced-motion safe. Next is Phase 5, CI; see ROADMAP.md.** Update this line as phases complete.

Double-O Agent is a 007-parody web app whose "secret agent" is an AI agent running SMB-finance missions (invoice extraction, duplicate hunting, reconciliation), streamed live to a spy-noir dashboard. The full what-and-why, stack rationale, and build phases live in [ROADMAP.md](./ROADMAP.md) — read it before proposing structural changes.

## Lore glossary & language rule

| Lore term | Means | Notes |
|---|---|---|
| **Mission** | one agent run over a task | e.g. "caccia ai doppioni" (duplicate hunt) |
| **Gadget** | a tool the agent can call | function-calling tool with JSON-schema params |
| **Q Branch** | gadget development / eval harness | quality control lives here |
| **HQ** | the Angular app (`apps/hq`) | where missions are launched and watched |
| **Control** | the NestJS app (`apps/control`) | runs the agent loop, streams events |
| **Debrief / Dossier** | mission summary / mission record card | |
| **S.P.E.T.T.R.O.** | the recurring villain: overdue invoices | |

**Language rule:** lore strings shown to users (mission names, villain, debrief prose) are **Italian**. UI chrome, README, code, comments, commits, and identifiers are **English**. The joke lives in UI strings and lore names at the domain level (gadgets, missions, debriefs) — never in low-level identifiers (no `vodkaMartiniService`).

## Commands

```bash
npm install            # root install, wires all workspaces (+ prisma generate)
npm run db             # docker compose up -d (Postgres)
npm run db:migrate     # prisma migrate dev (schema in apps/control/prisma)
npm run control        # start NestJS backend (apps/control)
npm run hq             # start Angular frontend (apps/hq)
npm run test           # all workspace tests
npm run lint           # all workspace lints
```

## Architecture

```
agent/
├── apps/
│   ├── hq/         # Angular — dashboard, mission feed UI
│   └── control/    # NestJS — agent loop, gadgets, SSE, persistence
├── libs/
│   └── shared/     # DTOs + mission-event types; the API contract
└── docker-compose.yml   # Postgres
```

- **SSE mission-event protocol** — the contract both apps implement. A mission run streams, in order, events of type: `briefing`, then interleaved `thinking` / `gadget_call` / `gadget_result`, closing with `debrief` (or `error`). Event payload types live in `libs/shared` and are the single source of truth; HQ renders each type distinctly (see the `add-gadget` skill).
- **LLM isolation rule:** OpenAI is called **only** inside `LlmService` in Control. No other file imports the OpenAI SDK. Swapping providers must remain a one-file change.

## Conventions

- DTOs and wire types live in `libs/shared` **only** — never redeclared in an app.
- Secrets go in `.env` (never committed); config is read via `@nestjs/config`.
- Skills in `.claude/skills/` govern recurring work: Angular components, SCSS, the spy visual theme, adding gadgets, Nest conventions. Prefer following a skill over improvising.
