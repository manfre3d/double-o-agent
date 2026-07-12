import { Injector, runInInjectionContext } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { injectViewTransition } from './view-transition';

describe('injectViewTransition', () => {
  it('mutates synchronously when the View Transitions API is absent', () => {
    // jsdom has neither startViewTransition nor matchMedia — the helper must
    // fall through to a plain synchronous mutate.
    const run = runInInjectionContext(TestBed.inject(Injector), () =>
      injectViewTransition(),
    );
    let mutated = false;
    run(() => {
      mutated = true;
    });
    expect(mutated).toBe(true);
  });
});
