import { ApplicationRef, inject } from '@angular/core';
import { motionOk } from './motion';

/**
 * Wraps a state mutation in a View Transition when the API is available and
 * motion is welcome; otherwise mutates directly. The tick() inside the
 * callback is load-bearing: signal writes render asynchronously, and the API
 * must capture the new DOM before it animates.
 */
export function injectViewTransition(): (mutate: () => void) => void {
  const appRef = inject(ApplicationRef);
  return (mutate) => {
    if (!motionOk() || typeof document.startViewTransition !== 'function') {
      mutate();
      return;
    }
    let mutated = false;
    try {
      document.startViewTransition(() => {
        mutated = true;
        mutate();
        appRef.tick();
      });
    } catch {
      if (!mutated) {
        mutate();
      }
    }
  };
}
