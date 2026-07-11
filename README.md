# Double-O Agent

A 007-parody web app whose "secret agent" is an AI agent running small-business finance missions — invoice extraction, duplicate hunting — streamed live, event by event, to a spy-noir dashboard. **HQ** (Angular) is where missions are launched and watched; **Control** (NestJS) runs the agent loop, executes the gadgets (tools), and streams the mission feed over SSE; Postgres keeps the dossier archive.

## Prerequisites

- **Node 24+** (npm workspaces do the monorepo wiring; CI runs on Node 24)
- **Docker** with the daemon running (Postgres lives in a compose container)
- **OpenAI API key** — optional; without one the app boots in demo mode (see below)

## First run

```bash
npm install                # installs all workspaces + generates the Prisma client
cp .env.example .env       # defaults work out of the box; add your OpenAI key for live missions
npm run db                 # starts Postgres (docker compose up -d)
npm run db:migrate         # applies the Prisma schema
```

Then, in two terminals:

```bash
npm run control            # Control — API on http://localhost:3000/api
npm run hq                 # HQ — dashboard on http://localhost:4200
```

Open <http://localhost:4200> (the dev server proxies `/api` to Control), press **«Avvia missione»** to watch a duplicate hunt live, or **«Consegna dossier (PDF)»** to upload an invoice PDF and watch the agent extract it.

## Demo mode vs live missions

Control picks its brain at boot:

- `OPENAI_API_KEY` missing or left as the `sk-replace-me` placeholder → **demo mode**: missions replay on a scripted brain, deterministic and free — no API calls. The debrief tells you it's a training exercise.
- A real key in `.env` → **live missions** against `OPENAI_MODEL` (default `gpt-4o-mini`).
- `DEMO_MODE=true` forces demo mode even with a real key.

## Everyday commands (repo root)

```bash
npm run db             # start Postgres container
npm run db:migrate     # prisma migrate dev
npm run control        # NestJS backend (watch mode)
npm run hq             # Angular frontend
npm run test           # all workspace tests
npm run lint           # all workspace lints
npm run eval           # Q Branch quality control (see below)
```

## Q Branch quality control

`npm run eval` scores the agent against a golden set of missions (`apps/control/src/qbranch/`): known invoices and duplicate batches with expected outcomes, replayed through the production prompts and agent loop. With a real API key the full set runs against the live LLM and the run fails below `--min-score` (default 80%); without one, a deterministic demo-replayable subset runs. CI executes lint, tests, both builds, and the eval on every push.

## Layout

```
agent/
├── apps/
│   ├── hq/         # Angular — dashboard, mission feed UI
│   └── control/    # NestJS — agent loop, gadgets, SSE, persistence
├── libs/
│   └── shared/     # DTOs + mission-event types; the API contract both apps import
└── docker-compose.yml   # Postgres
```

Conventions, lore glossary, and the mission-event protocol are documented in [CLAUDE.md](./CLAUDE.md).
