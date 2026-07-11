---
name: modern-best-practice-angular-components
description: Build clean, modern Angular components that apply common best practices and avoid common pitfalls like unnecessary lifecycle hooks, manual change detection, or imperative DOM manipulation
references:
  - references/signal-patterns.md
  - references/anti-patterns.md
  - references/component-anatomy.md
  - references/rxjs-interop.md
  - references/testing.md
---

# Writing Angular Components

We're using modern Angular (17+) with standalone components, signals, and the new control flow syntax. Follow these practices for clarity, correctness, and maintainability.

> **References** — load these for deeper coverage:
> - [[references/component-anatomy.md]] — canonical field ordering and full component template
> - [[references/signal-patterns.md]] — `linkedSignal`, `resource()`, `effect()` guard rules, equality
> - [[references/anti-patterns.md]] — concrete before/after for the most common mistakes
> - [[references/rxjs-interop.md]] — `toSignal`, `toObservable`, `takeUntilDestroyed`, decision flowchart
> - [[references/testing.md]] — `setInput()`, OnPush `detectChanges`, fake services, output testing

## Component Structure & Style  [[references/component-anatomy.md]]

- **PREFER** small, focused components with a single responsibility
- **PREFER** standalone components (`standalone: true`) — avoid NgModules for new components
- Keep templates flat and readable; avoid deeply nested structures
- Group related logic together (event handlers, computed values, signals)
- Use `inject()` for dependency injection over constructor injection

```ts
// PREFER
export class MyComponent {
  private readonly myService = inject(MyService);
}

// AVOID
export class MyComponent {
  constructor(private myService: MyService) {}
}
```

## Signals & Reactivity  [[references/signal-patterns.md]]

- **PREFER** signals over `BehaviorSubject` or plain class properties for reactive state
- **PREFER** `computed()` for derived values — never duplicate state
- **PREFER** `effect()` sparingly and only for true side effects (e.g. syncing to localStorage, analytics); never use it to derive state
- **AVOID** `ngOnChanges` for reacting to input changes — use `input()` signals with `computed()` instead

```ts
// PREFER
count = signal(0);
doubled = computed(() => this.count() * 2);

// AVOID
doubled = 0;
ngOnChanges() { this.doubled = this.count * 2; }
```

## Inputs & Outputs

- **PREFER** `input()` and `output()` (signal-based) over `@Input()` / `@Output()` decorators
- **PREFER** `model()` for two-way bindable values
- Use `input.required<T>()` for required inputs — avoids null checks downstream

```ts
// PREFER
name = input.required<string>();
theme = model<'light' | 'dark'>('light');
selected = output<Item>();

// AVOID
@Input() name!: string;
@Output() selected = new EventEmitter<Item>();
```

## Templates & Control Flow

- **PREFER** the new built-in control flow (`@if`, `@for`, `@switch`) over `*ngIf`, `*ngFor`, `*ngSwitch`
- Always provide `track` in `@for` loops; use a stable, unique identifier
- **AVOID** complex logic in templates — extract to `computed()` or component methods

```html
<!-- PREFER -->
@for (item of items(); track item.id) {
  <app-item [data]="item" />
}

@if (isVisible()) {
  <app-panel />
}

<!-- AVOID -->
<app-item *ngFor="let item of items" [data]="item" />
<app-panel *ngIf="isVisible" />
```

## Lifecycle Hooks

- **AVOID** lifecycle hooks when signals or `computed()` can express the same intent
- Use `ngOnInit` only for side effects that must run after construction (e.g., initial HTTP calls not covered by a data service)
- **AVOID** `ngOnChanges` — prefer signal inputs with `computed()` or `effect()`
- **AVOID** `ngDoCheck` and `ngAfterContentChecked` unless there is no alternative
- Clean up subscriptions in `ngOnDestroy` or, preferably, use `takeUntilDestroyed()`

```ts
// PREFER
private destroyRef = inject(DestroyRef);

ngOnInit() {
  this.myService.data$
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe(data => this.data.set(data));
}
```

## Change Detection

- **PREFER** `ChangeDetectionStrategy.OnPush` on every component
- Signal-based components with `OnPush` update automatically when signals change — no manual `markForCheck()` needed
- **AVOID** `ChangeDetectorRef.detectChanges()` or `markForCheck()` unless integrating with non-Angular code

## Services & Data  [[references/rxjs-interop.md]]

- **PREFER** `providedIn: 'root'` for singleton services
- Use `HttpClient` with typed responses; avoid casting `any`
- **PREFER** `toSignal()` to convert observables to signals at component boundaries
- **AVOID** subscribing inside components when `toSignal()` or `async` pipe suffices

```ts
// PREFER
data = toSignal(this.myService.fetchData(), { initialValue: [] });

// AVOID
ngOnInit() {
  this.myService.fetchData().subscribe(d => this.data = d);
}
```

## SSR Safety

- Guard browser-only APIs (`window`, `document`, `localStorage`, `navigator`) with `isPlatformBrowser(PLATFORM_ID)`
- Inject `PLATFORM_ID` via `inject(PLATFORM_ID)` and check before access
- **AVOID** direct DOM manipulation — use Angular's `Renderer2` or signal-driven template bindings

```ts
private platformId = inject(PLATFORM_ID);

ngOnInit() {
  if (isPlatformBrowser(this.platformId)) {
    // safe to access browser APIs
  }
}
```

## Styling

- Use component-scoped styles (default `ViewEncapsulation.Emulated`) — avoid `:host` overrides that bleed
- **AVOID** `ViewEncapsulation.None` unless building a global utility component
- Prefer CSS custom properties and SCSS variables for theming over inline styles
- **AVOID** `[ngStyle]` and `[ngClass]` with complex expressions — prefer dedicated `computed()` returning a class string or object

## Performance

- **PREFER** `OnPush` + signals over default change detection
- Use `@defer` blocks for lazy-loading heavy components below the fold
- **AVOID** premature optimization; reach for `@defer`, `trackBy`, or virtual scrolling only when there's a measurable issue
- Keep pipes pure (default); **AVOID** impure pipes unless absolutely required

## General Principles  [[references/anti-patterns.md]]

- Write code for humans first, compilers second
- Prefer explicitness over cleverness
- Optimize for readability and long-term maintenance
- If a pattern feels complex, reconsider the component boundary