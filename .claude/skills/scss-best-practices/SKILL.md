---
name: scss-best-practices
description: Write clean, maintainable SCSS for Angular components — design tokens, BEM naming, modern Sass modules, responsive patterns, and accessibility. Use when writing or modifying any stylesheet in apps/hq (palette values are owned by the spy-theme skill).
references:
  - references/design-tokens.md
  - references/naming-and-nesting.md
  - references/responsive-and-motion.md
  - references/anti-patterns.md
---

# Writing SCSS

This project uses SCSS throughout, with a design-token system in `apps/hq/src/styles/_tokens.scss` (palette values owned by the `spy-theme` skill) and per-component scoped stylesheets. Follow these practices for consistency, maintainability, and correctness.

## File layout (Phase 1 creates this)

```
apps/hq/src/styles/
├── _tokens.scss    # CSS custom properties — the ONLY place values live
├── _mixins.scss    # repeated patterns: stamp, scanlines, redaction, typewriter
├── _fonts.scss     # @font-face declarations
└── styles.scss     # global entry: reset + tokens + fonts + app shell
```

> **References** — load for deeper coverage:
> - [[references/design-tokens.md]] — CSS custom properties, token inventory, theming contract
> - [[references/naming-and-nesting.md]] — BEM conventions, SCSS nesting rules, `&` usage
> - [[references/responsive-and-motion.md]] — `clamp()`, breakpoints, `prefers-reduced-motion`
> - [[references/anti-patterns.md]] — before/after for the most common mistakes

## Design Tokens  [[references/design-tokens.md]]

- **ALWAYS** use CSS custom properties (`var(--gold)`, `var(--radius-*)`, etc.) for color, spacing tokens, shadows, and transitions — never hard-code raw values in component files
- All tokens are defined in `apps/hq/src/styles/_tokens.scss` under `:root` — one committed noir theme, no theme switching; the `spy-theme` skill owns the palette values and their meaning
- **AVOID** duplicating a token value — if you need a new shade, add a new token to `_tokens.scss`

```scss
// PREFER
color: var(--ink);
border-radius: var(--radius-card);
box-shadow: var(--shadow-sm);

// AVOID
color: #1a1a18;
border-radius: 12px;
```

## Naming & Structure  [[references/naming-and-nesting.md]]

- Use flat, descriptive BEM-style class names: `.block`, `.block__element`, `.block--modifier`
- In this project the convention is shorter: `.block-element` and `.block--modifier` (double-dash for modifiers only)
- Keep component stylesheets to the classes that component owns — no reaching into child components
- **PREFER** `&--modifier` and `&:hover` nesting over separate rules at the top level

```scss
// PREFER
.mission-chip {
  padding: 0.2rem 0.6rem;

  &--active {
    border-color: var(--gold);
    color: var(--gold);
  }

  &--muted {
    color: var(--phosphor);
  }
}

// AVOID
.mission-chip { padding: 0.2rem 0.6rem; }
.mission-chip--active { border-color: var(--gold); }
```

## Sass Module System

- **PREFER** `@use` over `@import` — `@import` is deprecated in Dart Sass
- Side-effect-only imports need no namespace (`@use 'some/library'`); shared mixins/functions use `@use '../partial' as name`
- **AVOID** `@import` for project partials
- No CSS framework: the base element reset lives at the top of `apps/hq/src/styles/styles.scss` — don't reintroduce framework-wide imports for single utilities

## Responsive Design  [[references/responsive-and-motion.md]]

- **PREFER** `clamp(min, preferred, max)` for fluid typography and spacing over hard breakpoints
- Use `max-width` breakpoints matching the project's established values (the first layout breakpoint gets decided in Phase 1 — define it once, then reuse it everywhere; the `860px` in examples is illustrative)
- Write media queries **inside** the rule they modify using SCSS nesting — not at the file bottom

```scss
// PREFER
.hero-bio {
  font-size: 0.975rem;
  max-width: 400px;

  @media (max-width: 860px) {
    max-width: 100%;
  }
}

// AVOID
.hero-bio { font-size: 0.975rem; max-width: 400px; }
@media (max-width: 860px) { .hero-bio { max-width: 100%; } }
```

## Theme

- Double-O Agent has **one committed theme** — the spy-noir look defined by the `spy-theme` skill. There is no light/dark toggle and no theme switching machinery.
- **AVOID** `@media (prefers-color-scheme: dark)` anywhere — it would introduce a second theme nobody designed. Token usage is still mandatory: if the palette ever shifts, `_tokens.scss` is the only file that changes.

## Motion & Accessibility  [[references/responsive-and-motion.md]]

- **ALWAYS** include a `@media (prefers-reduced-motion: reduce)` block for any animation or transition that is non-trivial
- The global `styles.scss` sets `transition-duration: 0.001ms` on all elements under `prefers-reduced-motion` (part of the Phase 1 global layer) — component-level animations (`@keyframes`, `animation:`) must be explicitly suppressed
- The `spy-theme` skill defines what may move (typewriter feed, stamps, redaction reveals) — check it before adding any animation

```scss
// PREFER
.my-element {
  animation: slide-in 0.5s var(--ease-out) both;
}

@media (prefers-reduced-motion: reduce) {
  .my-element { animation: none; }
}
```

## Layout Primitives

- **PREFER** CSS Grid and Flexbox over Bootstrap grid classes in component stylesheets
- Use the `inset` shorthand (`inset: 0`) instead of four separate `top/right/bottom/left: 0` declarations
- Use `gap` instead of margins between flex/grid children

## Performance

- **AVOID** universal selectors (`*`) and deep descendant selectors in component styles — they escape `ViewEncapsulation.Emulated`
- Keep `z-index` values meaningful and documented; use a consistent scale (0, 1, 10, 100, 200)
- **AVOID** `!important` — if you need it, the specificity architecture is wrong

## General Principles  [[references/anti-patterns.md]]

- Component stylesheets own only what they render — global utilities live in `styles.scss`
- Theming = tokens; layout = component styles; no overlap
- When in doubt, use a token rather than a raw value
