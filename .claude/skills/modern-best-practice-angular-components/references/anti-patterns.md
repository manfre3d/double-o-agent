# Angular Anti-Patterns Catalog

Concrete examples of what NOT to do, and the modern equivalent.

## State Management Anti-Patterns

### Duplicated state

```ts
// WRONG: derived value stored as separate signal
items = signal<Item[]>([]);
count = signal(0); // duplicate — goes stale

// CORRECT
items = signal<Item[]>([]);
count = computed(() => this.items().length);
```

### Mutable signal updates

```ts
// WRONG: mutates array in place; signal doesn't know it changed
const list = signal<string[]>([]);
list().push('new');  // no notification

// CORRECT
list.update(prev => [...prev, 'new']);
```

### Using effect() for derived state

```ts
// WRONG
effect(() => { this.fullName.set(`${this.first()} ${this.last()}`); });

// CORRECT
fullName = computed(() => `${this.first()} ${this.last()}`);
```

## Template Anti-Patterns

### Function calls in templates

```ts
// WRONG: evaluated on every change-detection cycle
// template: <p>{{ getFullName() }}</p>

// CORRECT
fullName = computed(() => `${this.first()} ${this.last()}`);
// template: <p>{{ fullName() }}</p>
```

### Nested subscriptions / subscribe-in-subscribe

```ts
// WRONG
ngOnInit() {
  this.userService.user$.subscribe(user => {
    this.orderService.getOrders(user.id).subscribe(orders => {
      this.orders = orders;
    });
  });
}

// CORRECT
orders = toSignal(
  toObservable(this.userId).pipe(
    switchMap(id => this.orderService.getOrders(id)),
  ),
  { initialValue: [] },
);
```

### trackBy omission in @for

```html
<!-- WRONG: tears down and recreates every DOM node on any list change -->
@for (item of items()) {
  <app-card [data]="item" />
}

<!-- CORRECT -->
@for (item of items(); track item.id) {
  <app-card [data]="item" />
}
```

## Lifecycle Hook Anti-Patterns

### ngOnChanges with signal inputs

```ts
// WRONG: redundant with signal inputs
ngOnChanges(changes: SimpleChanges) {
  if (changes['theme']) { this.applyTheme(changes['theme'].currentValue); }
}

// CORRECT
theme = input<'light' | 'dark'>('light');
// effect or computed reacts automatically
```

### Manual subscription without cleanup

```ts
// WRONG: memory leak
ngOnInit() {
  this.myService.data$.subscribe(d => this.data.set(d));
}

// CORRECT — option A: takeUntilDestroyed
private destroyRef = inject(DestroyRef);
ngOnInit() {
  this.myService.data$
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe(d => this.data.set(d));
}

// CORRECT — option B: toSignal (preferred when no complex pipeline)
data = toSignal(this.myService.data$, { initialValue: null });
```

### Empty lifecycle hooks

```ts
// WRONG: needless overhead
ngOnInit() {}
ngOnDestroy() {}

// CORRECT: delete them entirely
```

## Dependency Injection Anti-Patterns

### Constructor injection (legacy style)

```ts
// WRONG: verbose; can't be called outside constructor
constructor(
  private readonly router: Router,
  private readonly store: Store,
) {}

// CORRECT
private readonly router = inject(Router);
private readonly store = inject(Store);
```

### Injecting inside ngOnInit

```ts
// WRONG: throws; inject() only works in injection context
ngOnInit() {
  const svc = inject(MyService); // runtime error
}

// CORRECT: declare at class field level
private readonly svc = inject(MyService);
```

## Change Detection Anti-Patterns

### Default change detection with OnPush-eligible code

```ts
// WRONG: no strategy → checked on every app event
@Component({ template: '...' })
export class MyComponent {}

// CORRECT
@Component({ changeDetection: ChangeDetectionStrategy.OnPush, template: '...' })
export class MyComponent {}
```

### Calling markForCheck() with signals

```ts
// WRONG: redundant; signals notify OnPush automatically
private cdr = inject(ChangeDetectorRef);
effect(() => {
  this.value = this.signal();
  this.cdr.markForCheck(); // unnecessary
});

// CORRECT
value = this.signal; // just use the signal directly in the template
```
