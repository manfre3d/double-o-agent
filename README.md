# Double-O Agent

A 007-parody web app whose "secret agent" is an AI agent running small-business finance missions — invoice extraction, duplicate hunting — streamed live, event by event, to a spy-noir dashboard. **HQ** (Angular) is where missions are launched and watched; **Control** (NestJS) runs the agent loop, executes the gadgets (tools), and streams the mission feed over SSE; Postgres keeps the dossier archive.

> **Satire disclaimer** — Double-O Agent is a parody. It is not affiliated with, or endorsed by, the James Bond franchise or its rights holders. The tuxedoed "agent" is a language model doing bookkeeping; the villain is an overdue invoice. The finance work, however, is real.

## Prerequisites

- **Node 24+** (npm workspaces do the monorepo wiring; CI runs on Node 24)
- **Docker** with the daemon running (Postgres lives in a compose container)
- **OpenAI API key** — optional; without one every mission runs in demo mode, and with one visitors can still switch to demo per mission (see below)

## First run

```bash
npm install                # installs all workspaces + generates the Prisma client
cp .env.example .env       # boots as-is; add your OpenAI key for live missions, and a real SESSION_COOKIE_SECRET before sharing it
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

Each mission runs on one of two brains, chosen per launch from the **LIVE / DEMO** toggle in HQ's header:

- **Live** — the real agent against `OPENAI_MODEL` (default `gpt-4o-mini`). The default when a key is configured.
- **Demo** — a scripted brain that replays a fixed mission, deterministic and free, with no API calls. The debrief tells you it's a training exercise. Always available, so any visitor can preview the end result without spending credits.

If `OPENAI_API_KEY` is missing or left as the `sk-replace-me` placeholder, live is impossible: the toggle locks to demo and every mission runs scripted. `DEMO_MODE=true` forces demo globally even with a real key. Control exposes which is possible via `llmAvailable` on `/api/status`, so HQ can lock the toggle honestly.

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

## Deploy (Render + Neon)

Production is a single Render web service: Control serves the API **and** HQ's built bundle from the same origin (no CORS, no second deploy). The database is a free [Neon](https://neon.tech) Postgres. Everything is declared in [`render.yaml`](./render.yaml).

1. Create a Neon project and copy its Postgres connection string.
2. On Render: **New → Blueprint**, connect this repo. When prompted, paste the Neon string as `DATABASE_URL`; leave `OPENAI_API_KEY` empty to run every mission in demo mode, or set a real key so visitors can run live missions (they can still switch to demo per mission). `SESSION_COOKIE_SECRET` is generated automatically (`generateValue`) — nothing to paste; it keys the anonymous per-session cookie that isolates each visitor's missions.
3. Done. Every push to `main` redeploys automatically **after** the GitHub Actions run is green (`autoDeployTrigger: checksPass`); migrations run on boot (`prisma migrate deploy`).

Free-tier note: the service spins down when idle — the first visit after a quiet spell takes up to a minute to wake.

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
