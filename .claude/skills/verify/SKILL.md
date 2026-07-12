---
name: verify
description: How to run and drive Double-O Agent end-to-end for verification — infra bring-up, both apps, and browser-driving HQ with Playwright.
---

# Verifying Double-O Agent

## Bring-up

1. Postgres: `colima status` (start colima if stopped), then `npm run db`. Container `double-o-db` must be healthy.
2. `npm run control` (background) — port 3000. Without a usable `OPENAI_API_KEY` in `.env`, missions run on the scripted demo brain; either way a full mission streams.
3. `npm run hq` (background) — port 4200, proxies `/api` to Control.
4. Ready check: `curl localhost:3000/api/status` returns the Control status report; `localhost:4200` returns 200.

## Driving HQ (the surface is the browser)

Playwright is not a repo dependency. Install it in the session scratchpad (`npm init -y && npm install playwright`); the cached chromium in `~/Library/Caches/ms-playwright` works — no browser download needed.

Key flows and selectors:
- **Gun-barrel intro** plays on load, staged after the film sequence: a barrel beat (WebGL fly-through on `.barrel-canvas`, three.js in a lazy chunk; or the CSS `.barrel-dot` track when WebGL is unavailable), then `.stage-circle` (rifled iris) where the agent walks in, fires (`.stage-flash`), blood washes (`.stage-blood`), and the iris contracts — ~6s WebGL / ~5s CSS incl. fade. Overlay is `.barrel-screen`; click it to skip, wait for `detached` before touching the page. It never renders under `reducedMotion: 'reduce'` contexts or when `matchMedia` is missing.
- **Launch a mission**: click the `Avvia missione` button (`.mission-launch`); it disables and relabels while running. Feed entries are `.feed-entry`; typewriter caret is `.caret`; the mission ends when `.debrief` appears (allow 120s for live LLM). Gadget traffic renders via `app-gadget-transmission`: `.transmission-gadget` (gold call label), `.transmission-ledger` (invoice table), `.transmission-record` (key/value grid), `.transmission-mark--fail` (failed field marks), unknown payloads behind `details.transmission-raw`.
- **Audio toggle**: `.hq-audio` in the header (`Audio: attivo`/`Audio: silenziato`, `aria-pressed`); preference persists in `localStorage['hq.audio']`. Muted by default; archived transcripts are always silent.
- **Upload a dossier (extraction mission)**: the `Consegna dossier (PDF)` button proxies a hidden `input[type="file"]` — use `page.setInputFiles('input[type="file"]', pdfPath)` directly. Sample invoice: `apps/control/test/fixtures/fattura-di-prova.pdf`. The debrief card shows the recorded fields in `.debrief-record`; opening the archive card shows a `.dossier-extract` summary line.
- **Archive**: `.dossier-face` toggles a card; body is `.dossier-body`, stored debrief text `.dossier-redacted` (unredacts ~400ms after open), replay transcript is an instant `app-mission-feed` inside the body.

Gotchas:
- Angular re-renders async after a click — `waitFor({ state: 'detached' })` / `.waitFor()` on the expected element before counting, or probes race and report false failures.
- Webfont check: `document.fonts.check('16px "Oswald"')` (also `IBM Plex Mono`, `Special Elite`).
- Mobile overflow check: compare `scrollWidth` to `clientWidth` at 390px width.
