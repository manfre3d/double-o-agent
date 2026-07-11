# RxJS ↔ Signals Interop Reference

Patterns for bridging RxJS observables and Angular signals.

## toSignal — observable → signal

```ts
import { toSignal } from '@angular/core/rxjs-interop';

// Must be called in an injection context (field initializer or constructor)
items = toSignal(this.http.get<Item[]>('/api/items'), {
  initialValue: [],       // avoids `undefined` in template on first render
});

// Without initialValue the type includes `undefined`
user = toSignal(this.userService.user$); // Signal<User | undefined>
```

### Common options

| Option | Use case |
|--------|----------|
| `initialValue` | Provide a synchronous default; keeps type narrow |
| `requireSync` | Throw at init if observable doesn't emit synchronously (e.g. BehaviorSubject) |
| `injector` | Call outside injection context by passing a stored `Injector` |

```ts
// requireSync: safe when you know the observable is synchronous
count = toSignal(this.store.select(selectCount), { requireSync: true });
```

## toObservable — signal → observable

```ts
import { toObservable } from '@angular/core/rxjs-interop';

// Emits current value immediately, then on every change
userId$ = toObservable(this.userId);

// Common pattern: reactive HTTP call triggered by signal change
orders = toSignal(
  toObservable(this.userId).pipe(
    switchMap(id => this.orderService.getOrders(id)),
    catchError(() => of([])),
  ),
  { initialValue: [] },
);
```

## takeUntilDestroyed — subscription cleanup

```ts
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// In class field (injection context)
private destroyRef = inject(DestroyRef);

ngOnInit() {
  this.ws.messages$
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe(msg => this.messages.update(m => [...m, msg]));
}

// Or inline in class field (no DestroyRef needed — inferred from context)
private readonly sub = this.ws.messages$
  .pipe(takeUntilDestroyed())
  .subscribe(msg => this.messages.update(m => [...m, msg]));
```

## outputFromObservable / outputToObservable

```ts
import { outputFromObservable, outputToObservable } from '@angular/core/rxjs-interop';

// Wrap an observable as a signal-based output
valueChange = outputFromObservable(this.control.valueChanges);

// Consume a signal-based output as an observable (useful in tests)
const obs = outputToObservable(this.myOutput);
```

## resource() vs toSignal — when to use which

| Scenario | Prefer |
|----------|--------|
| Simple HTTP call, result depends on signals | `resource()` |
| Existing observable pipeline (map, filter, combineLatest) | `toSignal()` |
| Need to re-trigger / reload imperatively | `resource()` (call `.reload()`) |
| WebSocket / long-lived stream | `toSignal()` with `takeUntilDestroyed` |
| Store selector (NgRx, etc.) | `toSignal()` with `requireSync: true` |

## Decision flowchart

```
Need reactive async data?
  ├── comes from an RxJS observable?
  │     └── toSignal() — wrap at the component boundary
  └── HTTP fetch driven by signal params?
        └── resource() — self-contained, has loading/error/value
```
