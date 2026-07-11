# Responsive & Motion Reference

## Fluid typography with `clamp()`

Use `clamp(min, preferred, max)` for type scales that adapt without breakpoints:

```scss
// PREFER
font-size: clamp(1.75rem, 4vw, 2.5rem);   // section title
font-size: clamp(2.4rem, 5vw, 3.8rem);    // hero name

// AVOID
font-size: 2.5rem;
@media (max-width: 860px) { font-size: 1.75rem; }
```

`clamp()` also works for spacing when fluid scaling is desirable, but hard breakpoints are fine for layout structural changes (column collapsing, order resets).

## Breakpoints

No breakpoint is established yet — Phase 1 decides the first one. When introducing it, pick a single primary value, document it here, and reuse it for every layout collapse rather than scattering ad-hoc values (the `860px` in these examples is illustrative).

Write breakpoints **inside** the rule they modify:

```scss
.hero-layout {
  grid-template-columns: 1fr 300px;
  gap: 5rem;

  @media (max-width: 860px) {
    grid-template-columns: 1fr;
    gap: 2.5rem;
  }
}
```

This keeps the responsive logic co-located with the property it overrides — much easier to understand than scanning a file for a scattered `@media` block at the bottom.

## Animations and keyframes

- Declare `@keyframes` at the top level of the file (not nested inside a rule)
- Name keyframes after what they do, not where they're used: `@keyframes slide-up`, `@keyframes pulse-dot`
- Use the motion tokens for timing functions: `var(--ease-out)`, `var(--transition-fast)`

```scss
@keyframes hero-rise {
  from { opacity: 0; transform: translateY(18px); }
  to   { opacity: 1; transform: none; }
}

.hero-text > * {
  animation: hero-rise 0.7s var(--ease-out) both;
}
```

## `prefers-reduced-motion`

**Every non-trivial animation must have a `prefers-reduced-motion` suppression.**

The global `apps/hq/src/styles/styles.scss` (from Phase 1) sets `transition-duration: 0.001ms` and `animation-duration: 0.001ms` for all elements under `prefers-reduced-motion: reduce`, which covers CSS transitions. However, `animation:` declarations on specific elements still need explicit suppression:

```scss
.my-element {
  animation: float-in 0.6s var(--ease-out) both;
}

@media (prefers-reduced-motion: reduce) {
  .my-element { animation: none; }
}
```

For elements whose initial state is `opacity: 0` (set by an animation's `from` keyframe), also make sure they become visible:

```scss
@media (prefers-reduced-motion: reduce) {
  .feed-line {
    opacity: 1;   // the typewriter animation normally sets this; without it, it would stay 0
  }
}
```

## Scroll-driven animations (progressive enhancement)

Use `@supports (animation-timeline: scroll())` to add scroll-driven animations without breaking non-supporting browsers:

```scss
.scroll-progress {
  transform: scaleX(0);  // static fallback
}

@supports (animation-timeline: scroll()) {
  .scroll-progress {
    animation: progress-grow linear both;
    animation-timeline: scroll(root block);
  }
}
```

This keeps the baseline accessible while progressively enhancing for capable browsers.

## Layout utilities

- **`inset`**: `inset: 0` is shorthand for `top: 0; right: 0; bottom: 0; left: 0`
- **`gap`**: always prefer `gap` over margin hacks between flex/grid children
- **`pointer-events: none`**: standard on decorative overlays (canvas backgrounds, float shapes)
- **`position: sticky`** with `top: 0` for the header — pair with the `--header-h` token for offset calculations
