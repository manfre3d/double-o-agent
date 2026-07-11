# Testing Angular Signal Components Reference

Patterns for testing signal-based, OnPush components.

## TestBed setup — minimal boilerplate

```ts
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { CounterComponent } from './counter.component';

describe('CounterComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CounterComponent],   // standalone: just import the component
    });
  });

  it('increments count on click', () => {
    const fixture = TestBed.createComponent(CounterComponent);
    fixture.detectChanges();

    fixture.debugElement.query(By.css('button')).nativeElement.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('button').textContent).toContain('1');
  });
});
```

## Setting signal inputs

```ts
// Use fixture.componentRef.setInput() — the only correct way to set signal inputs in tests
it('displays the provided title', () => {
  const fixture = TestBed.createComponent(MyComponent);
  fixture.componentRef.setInput('title', 'Hello');
  fixture.detectChanges();

  expect(fixture.nativeElement.querySelector('h1').textContent).toBe('Hello');
});

// WRONG: direct property assignment bypasses the signal mechanism
fixture.componentInstance.title = 'Hello'; // has no effect on input()
```

## Testing computed values

```ts
it('doubles the count', () => {
  const fixture = TestBed.createComponent(CounterComponent);
  fixture.detectChanges();

  // Access the signal directly on the component instance
  fixture.componentInstance.count.set(3);
  fixture.detectChanges();

  expect(fixture.componentInstance.doubled()).toBe(6);
});
```

## Testing with services — prefer real services over mocks

```ts
// PREFER: provide a lightweight fake service rather than a full mock
class FakeItemService {
  getItems = () => of([{ id: 1, name: 'Test' }]);
}

beforeEach(() => {
  TestBed.configureTestingModule({
    imports: [ItemListComponent],
    providers: [{ provide: ItemService, useClass: FakeItemService }],
  });
});
```

## Testing outputs

```ts
it('emits selected event on item click', () => {
  const fixture = TestBed.createComponent(ItemListComponent);
  fixture.componentRef.setInput('items', [{ id: 1, name: 'A' }]);
  fixture.detectChanges();

  let emitted: Item | undefined;
  fixture.componentInstance.selected.subscribe((item: Item) => (emitted = item));

  fixture.debugElement.query(By.css('.item')).nativeElement.click();
  fixture.detectChanges();

  expect(emitted?.id).toBe(1);
});
```

## Testing async state (toSignal / resource)

```ts
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

beforeEach(() => {
  TestBed.configureTestingModule({
    imports: [DataComponent],
    providers: [provideHttpClient(), provideHttpClientTesting()],
  });
});

it('renders items from API', () => {
  const fixture = TestBed.createComponent(DataComponent);
  const http = TestBed.inject(HttpTestingController);

  fixture.detectChanges();

  http.expectOne('/api/items').flush([{ id: 1, name: 'Test' }]);
  fixture.detectChanges();

  expect(fixture.nativeElement.querySelectorAll('.item').length).toBe(1);

  http.verify();
});
```

## OnPush + detectChanges

With `OnPush`, you must call `fixture.detectChanges()` after any state change to flush signal updates into the DOM. Signal writes are synchronous but view updates are batched.

```ts
// Correct sequence for OnPush components
component.count.set(5);      // signal update (synchronous)
fixture.detectChanges();      // flush to DOM
expect(...);                  // assert after flush
```

## Avoid `compileComponents()`

With standalone components (no `templateUrl` compiled via Karma HTML), `compileComponents()` is unnecessary.

```ts
// UNNECESSARY for inline templates or when using esbuild test builder
beforeEach(async () => {
  await TestBed.configureTestingModule({ ... }).compileComponents(); // skip this
});
```
