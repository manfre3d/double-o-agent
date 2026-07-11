# Design Tokens Reference

## Token inventory (defined in `apps/hq/src/styles/_tokens.scss`)

> Palette values and their semantic meaning are owned by the **spy-theme** skill — that skill decides *what* the colors are; this file documents *how* they're consumed. If the two ever disagree, spy-theme wins and this table gets updated.

### Colors

| Token | Value | Use |
|---|---|---|
| `--noir-black` | `#0d0d0f` | App background, the void |
| `--gold` | `#c9a227` | Accents, active states — use sparingly |
| `--blood-red` | `#8b1e1e` | Errors, S.P.E.T.T.R.O., TOP SECRET stamps |
| `--dossier-paper` | `#efe6d0` | Card/document surfaces |
| `--ink` | `#1a1a18` | Text on paper surfaces |
| `--phosphor` | `#9fb8a4` | Terminal-green for the live mission feed |

Semantic aliases are allowed when a role outgrows its color (e.g. `--color-danger: var(--blood-red);`) — declared in `_tokens.scss`, still one source of truth.

### Spacing

| Token | Value | Use |
|---|---|---|
| `--space-1` | `0.25rem` | Tight gaps (inside chips, stamps) |
| `--space-2` | `0.5rem` | Element padding |
| `--space-3` | `1rem` | Component padding, gaps |
| `--space-4` | `2rem` | Section spacing |

### Typography

| Token | Value | Use |
|---|---|---|
| `--font-mono` | `'IBM Plex Mono', monospace` | Mission feed, data, stamps |
| `--font-display` | `'Oswald', sans-serif` | Headers, mission titles (uppercase) |

### Radii & Shadows

| Token | Value | Use |
|---|---|---|
| `--radius-card` | `2px` | Dossiers are paper, not bubbles |
| `--shadow-sm` | `0 1px 3px rgb(0 0 0 / 55%)` | Subtle paper lift |
| `--shadow-md` | `0 6px 20px rgb(0 0 0 / 65%)` | Cards over the noir background |

### Motion

| Token | Value | Use |
|---|---|---|
| `--transition-fast` | `150ms ease` | Hover micro-interactions |
| `--ease-out` | `cubic-bezier(0.22, 0.61, 0.36, 1)` | Entrances, reveals |

## Adding a new token

1. Add to `:root` in `apps/hq/src/styles/_tokens.scss` with a descriptive name
2. If it's a new *color*, check it against the spy-theme palette rules first (gold is scarce; red means wrong/classified) and record it in the spy-theme skill
3. Use `var(--your-token)` everywhere — never reference the raw value directly in component files

## Single-theme contract

Double-O Agent commits to one noir look — there is **no** light/dark switching and no `[data-theme]` machinery. Token discipline still applies: components that use `var(--*)` exclusively make any future palette change a one-file edit.

```scss
// This is WRONG — hard-coded value bypasses the palette contract
.my-block { background: #0d0d0f; }

// This is correct — use the token and it just works
.my-block { background: var(--noir-black); }
```
