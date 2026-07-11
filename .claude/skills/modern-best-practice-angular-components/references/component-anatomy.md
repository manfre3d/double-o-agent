# Component Anatomy Reference

Canonical structure for a modern Angular standalone component. Follow this field ordering consistently.

## Full template

```ts
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, model, output, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common'; // only if needed

@Component({
  selector: 'app-my-component',
  standalone: true,
  imports: [/* child components, pipes */],
  templateUrl: './my-component.component.html',
  styleUrl: './my-component.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyComponent {

  // ── 1. Injected services ────────────────────────────────────────────
  private readonly myService = inject(MyService);

  // ── 2. Inputs ───────────────────────────────────────────────────────
  title    = input.required<string>();
  theme    = model<'light' | 'dark'>('light');   // two-way bindable
  disabled = input(false);                        // optional with default

  // ── 3. Outputs ──────────────────────────────────────────────────────
  selected = output<Item>();

  // ── 4. Local state ──────────────────────────────────────────────────
  private count = signal(0);

  // ── 5. Derived / computed values ────────────────────────────────────
  doubled   = computed(() => this.count() * 2);
  label     = computed(() => `${this.title()} (${this.count()})`);

  // ── 6. Async state (toSignal / resource) ────────────────────────────
  items = toSignal(this.myService.getItems(), { initialValue: [] });

  // ── 7. Effects (side effects only) ──────────────────────────────────
  constructor() {
    effect(() => {
      // e.g. sync signal to localStorage
    });
  }

  // ── 8. Event handlers ───────────────────────────────────────────────
  increment(): void {
    this.count.update(n => n + 1);
  }

  select(item: Item): void {
    this.selected.emit(item);
  }
}
```

## Field ordering rationale

| Order | Category | Why first? |
|-------|----------|-----------|
| 1 | Injected services | Other fields may depend on them |
| 2 | Inputs | Public API; defines what the component accepts |
| 3 | Outputs | Public API; defines what the component emits |
| 4 | Local state | Foundation for derived values |
| 5 | Computed | Derived from state/inputs — must come after |
| 6 | Async state | Often depends on services and inputs |
| 7 | Effects | Side-effect-only; placed in constructor for injection context |
| 8 | Methods | Event handlers last; depend on everything above |

## Minimal component (no services, no async)

```ts
@Component({
  selector: 'app-counter',
  standalone: true,
  imports: [],
  template: `
    <button (click)="increment()">{{ count() }}</button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CounterComponent {
  count = signal(0);
  increment() { this.count.update(n => n + 1); }
}
```

## Template structure conventions

```html
<!-- 1. Structural wrapper (single root element or ng-container) -->
<section class="my-component" [class.disabled]="disabled()">

  <!-- 2. Loading / error guards first -->
  @if (items().length === 0) {
    <app-empty-state />
  } @else {

    <!-- 3. Content -->
    @for (item of items(); track item.id) {
      <app-item [data]="item" (click)="select(item)" />
    }
  }

</section>
```
