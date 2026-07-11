---
name: spy-theme
description: Visual identity contract for Double-O Agent — palette, typography, motifs, motion, and the lore/language rules. Use for ANY UI, styling, animation, or copywriting work in apps/hq, including "make it look better", mission feed rendering, and new components.
---

# Spy Theme — the visual identity contract

Every pixel of HQ commits to one look: **1960s spy-noir dossier**. When styling anything, check it against this contract. If a design choice isn't covered here, extend this file rather than improvising silently.

## Palette (design tokens)

Defined once in `apps/hq/src/styles/_tokens.scss` (created in Phase 1) as CSS custom properties. Never hard-code these values in components.

| Token | Value | Role |
|---|---|---|
| `--noir-black` | `#0d0d0f` | app background, the void |
| `--gold` | `#c9a227` | accents, active states, the Bond glint |
| `--blood-red` | `#8b1e1e` | errors, S.P.E.T.T.R.O., TOP SECRET stamps |
| `--dossier-paper` | `#efe6d0` | card/document surfaces |
| `--ink` | `#1a1a18` | text on paper surfaces |
| `--phosphor` | `#9fb8a4` | subtle terminal-green for the live feed |

Rules: gold is scarce (it reads as cheap when everywhere); red means something is wrong or classified — never decoration; large surfaces are noir-black or dossier-paper, nothing in between.

## Typography

- **Mission feed & data:** monospace/typewriter face (e.g. `IBM Plex Mono` or `Special Elite` for stamps) — the feed reads as a teletype transcript.
- **Headers & mission titles:** a condensed display face (e.g. `Oswald`/`Bebas Neue` class), uppercase, generous letter-spacing.
- **Body/chrome:** a quiet grotesque; the chrome must not compete with the dossier.

## Motifs

- **Redaction bars** that un-redact: content appears as black bars, then reveals (on load or on hover). Use for debrief reveals.
- **TOP SECRET stamps:** rotated, blood-red, slightly distressed; on dossier cards and completed missions.
- **Gun-barrel intro:** the app's loading/intro moment (Phase 4) — iris circle sweep, then HQ.
- **Scanlines / paper grain:** at whisper opacity on their respective surfaces; texture, never noise.
- **Dossier cards:** missions render as paper files — tab corner, stamp, typewritten metadata (`MISSIONE N. 007-042`, `STATO: COMPLETATA`).

## Motion rules

- Angular animations (`@angular/animations` or CSS transitions) — no animation libraries.
- **Typewriter effect** for incoming feed events: characters appear at teletype speed; `gadget_result` payloads may appear instantly (data isn't prose).
- Motion is diegetic: things stamp, slide like paper, or reveal like redactions. No bouncy easings, no confetti.
- Respect `prefers-reduced-motion`: all motion collapses to instant state changes.

## Lore & language (short form — full glossary in CLAUDE.md)

Mission, Gadget, Q Branch, HQ (Angular), Control (Nest), Debrief/Dossier, S.P.E.T.T.R.O. (overdue invoices).

- Lore strings users see: **Italian** ("Avvia missione", "Rapporto di missione", "S.P.E.T.T.R.O. individuato").
- Chrome, code, identifiers, docs: **English**.

## Tone guardrail

The joke lives in **UI strings and lore names only** — mission titles, debrief prose, stamps, the villain. It never leaks into low-level identifiers, CSS class names, log messages, or error handling. `MissionDebriefComponent`, not `MartiniShakerComponent`. A developer reading the code should find a clean finance app; a user watching the screen should find a spy film.
