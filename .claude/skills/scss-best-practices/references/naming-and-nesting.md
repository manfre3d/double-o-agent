# Naming & Nesting Reference

## Class naming conventions

This project uses a BEM-inspired convention without strict block/element/modifier formalism:

- **Block**: `.hero-wrapper`, `.badge-chip`, `.section-label`
- **Element** (child of block): `.hero-text`, `.hero-name`, `.hero-actions` — single hyphen separator
- **Modifier**: `.badge-chip--accent`, `.badge-chip--muted` — double hyphen only for modifiers

No `__` element separator — the project consistently uses single hyphens throughout. Follow this pattern for new classes.

### Naming rules

- Names must be meaningful and describe *what the element is*, not what it looks like
- **AVOID** presentational names: `.red-text`, `.mt-16`, `.flex-center`
- **AVOID** overly generic names: `.container`, `.wrapper` (qualify them: `.hero-wrapper`)
- Use lowercase with hyphens — no camelCase or underscores in class names

## SCSS nesting

### Depth limit

Nest at most **2 levels deep**. Beyond that, the selector specificity climbs and becomes hard to override.

```scss
// PREFER — 2 levels max
.hero-photo-frame {
  overflow: hidden;

  &:hover .hero-photo {   // OK: pseudo + child in one rule
    transform: scale(1.03);
  }
}

// AVOID — 3+ levels
.hero-visual {
  .hero-photo-frame {
    .hero-photo {         // now it's a 3-level deep selector
      transform: scale(1.03);
    }
  }
}
```

### What belongs inside the rule

Nest these inside the parent rule:
- `&:hover`, `&:focus`, `&:focus-visible` — state pseudo-classes
- `&::before`, `&::after` — pseudo-elements
- `&--modifier` — BEM modifier variants
- `@media (...)` — breakpoints that affect only this element

Do **not** nest unrelated sibling elements even if they appear nearby in the template.

```scss
// PREFER
.section-label {
  color: var(--gold);

  &::before {
    content: '';
    width: 1.75rem;
    background: linear-gradient(90deg, transparent, var(--gold));
  }

  &::after {
    content: '';
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background-color: var(--gold);
  }
}

// AVOID — .section-title is a sibling, not a child
.section-label {
  color: var(--gold);

  + .section-title {    // sibling combinator — hard to follow
    margin-top: 0.5rem;
  }
}
```

### `&` parent reference

Use `&` to build modifier class names without repeating the block name:

```scss
.social-icon {
  color: var(--phosphor);

  &:hover {
    color: var(--gold);
    border-color: var(--gold);
  }
}
```

**AVOID** using `&` to build element class names (`.block &__element`) — it produces confusing output selectors and breaks `Cmd+F` searchability.

## Global vs component styles

| Belongs in the global layer (`apps/hq/src/styles/`) | Belongs in component `.scss` |
|---|---|
| Design tokens (`:root` in `_tokens.scss`) | Component-specific layout |
| Base resets (`html`, `body`, `a`) in `styles.scss` | State classes local to the component |
| Reusable utility classes and mixins (`.stamp`, `@include scanlines`) in `_mixins.scss` | Responsive overrides for the component |
| `@keyframes` used across multiple components | `@keyframes` only this component uses |

If a class is used by more than one component, move it to the global layer.
