import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { motionOk } from '../motion';

/** Count-ups settle within 700ms, per the spy-theme motion rules. */
const COUNT_UP_MS = 700;

/**
 * Animates a numeric stat from 0 to its value on first render, then snaps on
 * later changes (data refreshes never replay the entrance). The formatted
 * final value stays available to assistive tech; the counting copy is
 * aria-hidden, mirroring TypewriterText.
 */
@Component({
  selector: 'app-stat-value',
  template: `<span class="full-value">{{ full() }}</span
    ><span aria-hidden="true">{{ display() }}</span>`,
  styles: `
    .full-value {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip-path: inset(50%);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatValue {
  readonly value = input.required<number>();
  readonly format = input<(n: number) => string>(String);

  private readonly shown = signal(0);

  protected readonly full = computed(() => this.format()(this.value()));
  protected readonly display = computed(() => this.format()(this.shown()));

  constructor() {
    let raf = 0;
    let first = true;
    const stop = () => cancelAnimationFrame(raf);
    inject(DestroyRef).onDestroy(stop);

    effect(() => {
      const target = this.value();
      stop();
      if (!first || !motionOk()) {
        this.shown.set(target);
        return;
      }
      first = false;
      const startedAt = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - startedAt) / COUNT_UP_MS);
        if (t >= 1) {
          this.shown.set(target);
          return;
        }
        this.shown.set(Math.round(target * (1 - (1 - t) ** 3)));
        raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    });
  }
}
