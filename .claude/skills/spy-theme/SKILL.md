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
- **Gun-barrel intro:** the app's loading/intro moment, staged after the classic film sequence — a barrel beat (WebGL fly-through braking onto the iris, or the CSS dot tracking across black) lands on the rifled iris circle; the agent walks in through it on an eight-frame stepped film-strip walk cycle (two contact→recoil→crossing→passing half-cycles, entrance distance timed to whole gait cycles so the feet never slide); the four-frame finale strip follows — the stop (a gunless profile stand reusing the walk's passing pose, so he freezes out of the stride), draw-and-turn compressed into one three-quarter frame, square to the camera, the shot (muzzle flash synced to the fire frame, whose drawing carries the muzzle halo) — paced as stillness then the whip: the long quiet hold happens BEFORE the pistol is ever shown, drawing, turning and firing snap through as one explosive action, and the sequence stops on the shot, the braced fire pose held while the blood descends (he never stands down); a **blood-red wash** with a lobed liquid leading edge descends inside the iris while the iris sways; the iris staggers, contracts away and the overlay fades to HQ. Frame swaps use the film-gate model: all frames of a movement live in ONE SVG strip on uniform cells stepped past an overflow window by a single `steps()` or hold-keyframe animation — never separate elements crossfaded by parallel animations (they desync and blink). The blood wash is reserved for this moment only — it never appears in the dashboard.
- **Agent silhouette:** one inline-SVG figure (long wavy hair, tailored blazer, pistol) traced from generated stills into single flat paths, shared by the intro and the HQ hero (`AgentSilhouette` — film-strip poses `walk` (8 frames) and `turn` (4 frames) for the intro, `hero` for the rail, `portrait` at ease). Always a flat silhouette in a single ink via `currentColor` — never a detailed illustration, photo, or raster asset in the app.
- **Scanlines / paper grain:** at whisper opacity on their respective surfaces; texture, never noise.
- **Dossier cards:** missions render as paper files — tab corner, stamp, typewritten metadata (`MISSIONE N. 007-042`, `STATO: COMPLETATA`).

## State treatments

Every async state has one sanctioned look. The mixins live in `_mixins.scss`; `styles.scss` exposes them as the global utility classes `.loading-cursor`, `.empty-stamp` + `.empty-stamp-mark`, and `.error-frame` — use those classes in templates rather than re-including the mixins per component (budgets stay lean, one implementation everywhere):

- **Loading:** a phosphor mono line ending in a blinking block cursor (`.loading-cursor`). Italian copy, no spinners.
- **Empty:** a dashed hairline box (`.empty-stamp`) holding a muted rotated stamp (`.empty-stamp-mark`) plus a mono note. Empty is not an error — never blood-red.
- **Error:** the "transmission interrupted" frame (`.error-frame`): blood-red hairline border with a thicker left rule, faint blood-red tint fill (`--blood-red-dim`), uppercase mono. All status/feed/archive/analytics errors use this one treatment.

## Gadget transmissions

The feed renders gadget traffic as intercepted transmissions, never raw JSON at top level:

- `gadget_call`: the gadget name as a gold mono label, params as typewritten key/value lines.
- `gadget_result`: known payload shapes render richly — invoice arrays as a phosphor ledger table, comparisons as a two-row match report with ✓/✗ marks, recorded invoices as a typed record grid, plain text as a truncated excerpt. Unknown payloads collapse behind a native `<details>` labeled "Dati grezzi". Failed results use the error frame.
- Shape detection is structural (what the payload looks like), not gadget-name keyed — new gadgets returning known shapes render richly for free.

## Motion rules

- Angular animations (`@angular/animations` or CSS transitions) — no animation libraries in the dashboard itself (WebGL exception below).
- **Typewriter effect** for incoming feed events: characters appear at teletype speed; `gadget_result` payloads may appear instantly (data isn't prose).
- Motion is diegetic: things stamp, slide like paper, or reveal like redactions. No bouncy easings, no confetti. Custom `linear()` easing curves are sanctioned where a physical material needs them (the intro's liquid wash, a worn mechanism giving way) — still never a bounce or overshoot.
- **Redaction reveal** is a left→right wipe (`--transition-reveal`, ~600 ms, `--ease-out`) — one bar per wrapped line, all lines wiping in parallel.
- **Scroll-driven reveals** (dossier cards rising into view) are progressive enhancement via `animation-timeline: view()`: unsupported browsers and reduced motion get the static final state. The global reduced-motion squash does NOT cover scroll-driven animations — always wrap them in `@media (prefers-reduced-motion: no-preference)`.
- **Hero figure motion** is whisper-quiet: the full-height figure fixed to the left rail (poster ground — diagonal gold shaft, head halo, bottom dissolve, content layered above it) drifts a few vh over the full scroll (scroll-driven, progressive enhancement) and its backlight breathes on a slow loop. No walking, waving, or literal character animation — the figure holds its pose.
- **Expand/collapse** may use the View Transitions API (~250 ms paper-dissolve crossfade) when supported; otherwise the change is instant. No geometry morphs.
- **Numeric count-ups** (analytics tiles) settle within ~700 ms and play on first render only — never replayed on data refresh.
- **WebGL exception:** `three` is permitted for the gun-barrel intro ONLY — dynamically imported so it lives in its own lazy chunk, never the initial bundle. The CSS intro remains the mandatory fallback (no WebGL, reduced motion, or load failure). All in-dashboard motion stays CSS/native.
- **Arrival beat:** when the intro overlay fades, HQ does not simply sit there fully formed — the letterhead assembles: sections rise in a short stagger (the global `rise-in`, ~90 ms apart), the header insignia stamps on once (straight, no rotation — `stamp-in` with `--stamp-angle: 0deg`), and the title declassifies via the redaction reveal. Plays once per page load, gated on the intro's `finished` signal; under reduced motion the intro self-skips and the page appears settled.
- Respect `prefers-reduced-motion`: all motion collapses to instant state changes.

## Sound

- **Muted by default.** Opt-in via the header toggle (`Audio: attivo` / `Audio: silenziato`), preference persisted in localStorage.
- **WebAudio synthesis only** — no audio files, ever.
- Cues are diegetic and whisper-quiet: teletype tick (typewriter chars, throttled), stamp thunk (debrief stamp), relay click (gadget dispatch). Nothing else makes sound.
- Nothing plays before a user gesture (autoplay policy); archived/instant transcripts are always silent.

## Chrome

- **Scrollbars:** gold-dim thumb on noir track, app-wide (`scrollbar-color` plus the `::-webkit-scrollbar` layer for Safari).
- **Header insignia:** a single hand-authored inline-SVG roundel in gold line-work (circles, tick marks, crosshair, "00" monogram). Static — it does not rotate or glint (its one animation is the arrival stamp above).
- **Page vignette:** the body carries a fixed `--noir-veil` radial falloff darkening the page edges — the barrel iris echoed on the page. Sanctioned noir-on-noir depth; it never dims panel content (background layer only). Implemented as a fixed `body::before` layer, never `background-attachment: fixed` (iOS Safari lacks it).
- **Masthead tagline & footer colophon:** the header carries one plain-language sentence saying what the app actually does (chrome copy, English); the page ends on a quiet centered mono footer holding the satire disclaimer (parody, not affiliated with the Bond franchise). Both are chrome — the lore never replaces them.
- **App icon / favicon:** the header insignia on a noir tile (`public/icon.svg`, gold `#c9a227` on `#0d0d0f` — raw values, tokens don't reach standalone assets), rasterized to `favicon.ico`, `icon-192/512.png`, `apple-touch-icon.png`, and a maskable variant wired via `manifest.webmanifest`. Regenerate all rasters from `icon.svg` if the insignia changes.
- **Mobile:** the page never scrolls horizontally — wide data (ledger tables) pans inside its own `overflow-x: auto` container; feed grid cells carry `min-width: 0`. The masthead tightens tracking below the narrow breakpoint instead of wrapping.

## Lore & language (short form — full glossary in CLAUDE.md)

Mission, Gadget, Q Branch, HQ (Angular), Control (Nest), Debrief/Dossier, S.P.E.T.T.R.O. (overdue invoices).

- Lore strings users see: **Italian** ("Avvia missione", "Rapporto di missione", "S.P.E.T.T.R.O. individuato").
- Chrome, code, identifiers, docs: **English**.

## Tone guardrail

The joke lives in **UI strings and lore names only** — mission titles, debrief prose, stamps, the villain. It never leaks into low-level identifiers, CSS class names, log messages, or error handling. `MissionDebriefComponent`, not `MartiniShakerComponent`. A developer reading the code should find a clean finance app; a user watching the screen should find a spy film.
