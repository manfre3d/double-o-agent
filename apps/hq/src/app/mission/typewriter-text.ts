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
import { SoundService } from '../sound.service';

/** ~60 characters per second — teletype speed. */
const CHAR_INTERVAL_MS = 16;

@Component({
  selector: 'app-typewriter-text',
  template: `<span class="full-text">{{ text() }}</span
    ><span aria-hidden="true"
      >{{ visible() }}@if (typing()) {<span class="caret">&#9612;</span>}</span
    >`,
  styles: `
    .full-text {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip-path: inset(50%);
    }

    .caret {
      animation: caret-blink 0.9s steps(2, jump-none) infinite;
    }

    @keyframes caret-blink {
      50% {
        opacity: 0;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .caret {
        animation: none;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TypewriterText {
  readonly text = input.required<string>();
  readonly instant = input(false);

  private readonly shown = signal(0);

  protected readonly visible = computed(() => this.text().slice(0, this.shown()));
  protected readonly typing = computed(() => this.shown() < this.text().length);

  constructor() {
    const sound = inject(SoundService);
    let interval: ReturnType<typeof setInterval> | undefined;
    const stop = () => clearInterval(interval);
    inject(DestroyRef).onDestroy(stop);

    effect(() => {
      const length = this.text().length;
      stop();
      if (this.instant() || !motionOk()) {
        this.shown.set(length);
        return;
      }
      this.shown.set(0);
      // The instant/reduced-motion paths never enter this interval, so
      // archived transcripts stay silent by construction.
      interval = setInterval(() => {
        this.shown.update((n) => n + 1);
        sound.typeTick();
        if (this.shown() >= length) {
          stop();
        }
      }, CHAR_INTERVAL_MS);
    });
  }
}
