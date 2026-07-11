# Signal Patterns Reference

Advanced signal patterns for Angular 17+.

## Core Primitives

```ts
// Writable signal
const count = signal(0);
count.set(1);
count.update(n => n + 1);

// Read-only derived value
const doubled = computed(() => count() * 2);

// Side effect — runs when dependencies change
effect(() => localStorage.setItem('count', String(count())));
```

## linkedSignal — two-way derived state

Use when a signal must reset/derive from another signal but also accept local writes.

```ts
// Resets to items()[0] whenever items() changes, but stays writable locally
selectedItem = linkedSignal(() => this.items()[0]);

// With explicit computation + reset
selectedItem = linkedSignal({
  source: this.items,
  computation: (items, prev) => items.find(i => i.id === prev?.value?.id) ?? items[0],
});
```

## resource() — async reactive data

Replaces `ngOnInit + subscribe` for data that depends on signals.

```ts
userResource = resource({
  request: () => ({ id: this.userId() }),
  loader: ({ request }) => fetch(`/api/users/${request.id}`).then(r => r.json()),
});

// In template
@if (userResource.isLoading()) { <app-spinner /> }
@if (userResource.value(); as user) { <p>{{ user.name }}</p> }
@if (userResource.error(); as err) { <p>Error: {{ err }}</p> }
```

## toSignal — observable → signal at component boundary

```ts
// Requires injection context; completes automatically with component lifetime
data = toSignal(this.http.get<Item[]>('/api/items'), { initialValue: [] });

// With explicit error/loading state
dataReq = toSignal(this.http.get<Item[]>('/api/items').pipe(
  startWith(null),
  catchError(err => of({ error: err })),
));
```

## input() + computed() — replace ngOnChanges

```ts
// PREFER: reactive chain, no lifecycle hook
userId = input.required<string>();
user = computed(() => this.users().find(u => u.id === this.userId()));

// AVOID
@Input() userId!: string;
ngOnChanges(changes: SimpleChanges) {
  if (changes['userId']) { this.loadUser(changes['userId'].currentValue); }
}
```

## effect() — guard against common mistakes

```ts
// CORRECT: read signals synchronously, side-effect only
effect(() => {
  const theme = this.theme();          // tracked dependency
  document.documentElement.setAttribute('data-theme', theme); // side effect
});

// WRONG: setting another signal inside effect creates circular/cascading updates
effect(() => {
  this.derived.set(this.source() * 2); // use computed() instead
});

// WRONG: async inside effect loses the reactive context
effect(async () => {
  const id = this.userId();
  const user = await fetch(`/api/${id}`).then(r => r.json()); // use resource() instead
  this.user.set(user);
});
```

## Signal equality — avoid unnecessary recomputation

```ts
// Default: strict equality (===). For objects/arrays, provide a comparator:
items = signal<Item[]>([], { equal: (a, b) => a.length === b.length && a.every((v, i) => v.id === b[i].id) });

// Or use a shallow comparison helper
import { isEqual } from 'lodash-es'; // or a lightweight alternative
data = signal<Config>({}, { equal: isEqual });
```
