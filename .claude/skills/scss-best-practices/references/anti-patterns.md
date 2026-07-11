# SCSS Anti-Patterns

## Hard-coding colors or spacing

**BEFORE** (wrong):
```scss
.my-card {
  background: #efe6d0;
  color: #1a1a18;
  border-radius: 2px;
  box-shadow: 0 8px 24px rgba(13, 13, 15, 0.4);
}
```

**AFTER** (correct):
```scss
.my-card {
  background: var(--dossier-paper);
  color: var(--ink);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-md);
}
```

**Why:** Hard-coded values bypass the spy-theme palette contract and require a global find-replace if the palette changes.

---

## `@media (prefers-color-scheme: dark)` in component files

**BEFORE** (wrong):
```scss
.btn {
  background: var(--dossier-paper);

  @media (prefers-color-scheme: dark) {
    background: #151523;
  }
}
```

**AFTER** (correct):
```scss
.btn {
  background: var(--dossier-paper);
}
```

**Why:** Double-O Agent has a single committed noir theme (see the `spy-theme` skill) — there is no dark-mode variant. A `prefers-color-scheme` block introduces a second theme nobody designed.

---

## Overusing `!important`

**BEFORE** (wrong):
```scss
.section-title {
  color: var(--ink) !important;
}
```

**AFTER** (correct): Fix the specificity conflict instead. Flatten the selector or restructure which file owns the rule.

**Why:** `!important` is a sign that selector specificity is out of control. It also makes the property impossible to override for legitimate state variations (disabled, error, etc.).

---

## Deep nesting

**BEFORE** (wrong):
```scss
.hero {
  .hero-visual {
    .hero-photo-frame {
      .hero-photo {
        transform: scale(1.03);
      }
    }
  }
}
```

**AFTER** (correct):
```scss
.hero-photo-frame:hover .hero-photo {
  transform: scale(1.03);
}
```

**Why:** Deep nesting produces overly specific selectors that are hard to override and slow to parse. Keep nesting to 2 levels max.

---

## `@import` instead of `@use`

**BEFORE** (wrong):
```scss
@import 'variables';
@import 'bootstrap/scss/bootstrap';
```

**AFTER** (correct):
```scss
@use 'bootstrap/scss/bootstrap';
```

**Why:** `@import` is deprecated in Dart Sass and will eventually be removed. It also leaks variables and mixins into global scope, creating collision risk.

---

## Animations without `prefers-reduced-motion`

**BEFORE** (wrong):
```scss
.floating-shape {
  animation: float 3s ease-in-out infinite;
}
```

**AFTER** (correct):
```scss
.floating-shape {
  animation: float 3s ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
  .floating-shape { animation: none; }
}
```

**Why:** Users with vestibular disorders or motion sensitivity can experience nausea from persistent animations. This is a WCAG 2.1 AA requirement.

---

## Styling component internals from a parent

**BEFORE** (wrong — in `hero.component.scss`):
```scss
.hero-wrapper {
  app-header .header-nav {   // reaching into a child component
    color: red;
  }
}
```

**AFTER** (correct): Pass an `input()` to the child, or add the style to `header.component.scss`.

**Why:** Angular's `ViewEncapsulation.Emulated` prevents this from working reliably. Even if it works today (e.g. via `:host-context`), it creates tight coupling between components.

---

## Magic `z-index` values

**BEFORE** (wrong):
```scss
.tooltip { z-index: 9999; }
.modal   { z-index: 99999; }
```

**AFTER** (correct): Use the established scale: `0` → `1` → `10` → `100` → `200`. Reserve the top of the scale for full-screen overlays (the gun-barrel intro, modals).

**Why:** Arbitrary high values make stacking context conflicts impossible to debug.
