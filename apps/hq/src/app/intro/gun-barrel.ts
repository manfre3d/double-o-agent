import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  afterNextRender,
  inject,
  output,
} from '@angular/core';
import { motionOk } from '../motion';

/** Matches the end of the CSS timeline in gun-barrel.scss. */
const INTRO_DURATION_MS = 2700;

@Component({
  selector: 'app-gun-barrel',
  templateUrl: './gun-barrel.html',
  styleUrl: './gun-barrel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GunBarrel {
  readonly finished = output<void>();

  private timer: ReturnType<typeof setTimeout> | undefined;
  private done = false;

  constructor() {
    afterNextRender(() => {
      if (motionOk()) {
        this.timer = setTimeout(() => this.finish(), INTRO_DURATION_MS);
      } else {
        this.finish();
      }
    });

    inject(DestroyRef).onDestroy(() => clearTimeout(this.timer));
  }

  protected skip(): void {
    clearTimeout(this.timer);
    this.finish();
  }

  private finish(): void {
    if (!this.done) {
      this.done = true;
      this.finished.emit();
    }
  }
}
