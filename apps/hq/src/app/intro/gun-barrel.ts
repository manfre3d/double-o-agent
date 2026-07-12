import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  type ElementRef,
  afterNextRender,
  inject,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { AgentSilhouette } from '../agent-silhouette';
import { motionOk } from '../motion';

// The classic gun-barrel sequence. A barrel beat (WebGL fly-through, or the
// CSS dot tracking across the screen) lands on the rifled iris circle; the
// agent walks in through it on an eight-frame film-strip walk cycle, then
// the finale strip — he freezes out of the stride, whips through draw-and-
// turn to face the camera, fires, and holds the shot (strips and muzzle
// flash timed in the SCSS; AIM_MS must match the turn-strip duration
// there) — blood washes
// down inside the iris behind a liquid edge, the iris sways and contracts
// away, and the overlay fades to HQ.
const DOT_MS = 1300;
const CIRCLE_MS = 2100;
const AIM_MS = 1300;
const BLOOD_MS = 1150;
const CONTRACT_MS = 550;
const FADE_MS = 400;

type IntroStage = 'barrel' | 'circle' | 'aim' | 'blood' | 'contract';

interface IntroScene {
  start(canvas: HTMLCanvasElement, onDone: () => void): void;
  skip(): void;
  dispose(): void;
}

@Component({
  selector: 'app-gun-barrel',
  imports: [AgentSilhouette],
  templateUrl: './gun-barrel.html',
  styleUrl: './gun-barrel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GunBarrel {
  readonly finished = output<void>();

  // The WebGL fly-through is the hero opening; the CSS dot-track remains the
  // fallback for reduced motion, missing WebGL, or a failed chunk load.
  protected readonly mode = signal<'css' | 'webgl'>(
    motionOk() && webglSupported() ? 'webgl' : 'css',
  );
  protected readonly stage = signal<IntroStage>('barrel');
  protected readonly closing = signal(false);

  private readonly glCanvas = viewChild<ElementRef<HTMLCanvasElement>>('glCanvas');

  private scene: IntroScene | undefined;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private done = false;

  constructor() {
    afterNextRender(() => {
      if (!motionOk()) {
        this.finish();
      } else if (this.mode() === 'webgl') {
        void this.startWebgl();
      } else {
        this.startCssBarrel();
      }
    });

    inject(DestroyRef).onDestroy(() => {
      clearTimeout(this.timer);
      this.scene?.dispose();
    });
  }

  protected skip(): void {
    clearTimeout(this.timer);
    this.finish();
  }

  private async startWebgl(): Promise<void> {
    const canvas = this.glCanvas()?.nativeElement;
    if (!canvas) {
      this.fallBackToCss();
      return;
    }
    try {
      const { GunBarrelScene } = await import('./gun-barrel-scene');
      if (this.done) {
        return;
      }
      this.scene = new GunBarrelScene();
      this.scene.start(canvas, () => this.beginCircleStage());
    } catch {
      this.fallBackToCss();
    }
  }

  private startCssBarrel(): void {
    this.timer = setTimeout(() => this.beginCircleStage(), DOT_MS);
  }

  private fallBackToCss(): void {
    this.mode.set('css');
    this.startCssBarrel();
  }

  /** Walk in, turn, fire, bleed, iris out. */
  private beginCircleStage(): void {
    if (this.done) {
      return;
    }
    this.advance('circle', CIRCLE_MS, () =>
      this.advance('aim', AIM_MS, () =>
        this.advance('blood', BLOOD_MS, () =>
          this.advance('contract', CONTRACT_MS, () => this.close()),
        ),
      ),
    );
  }

  private advance(stage: IntroStage, ms: number, next: () => void): void {
    this.stage.set(stage);
    this.timer = setTimeout(next, ms);
  }

  private close(): void {
    if (!this.done && !this.closing()) {
      this.closing.set(true);
      this.timer = setTimeout(() => this.finish(), FADE_MS);
    }
  }

  private finish(): void {
    if (!this.done) {
      this.done = true;
      this.finished.emit();
    }
  }
}

function webglSupported(): boolean {
  try {
    return document.createElement('canvas').getContext('webgl2') !== null;
  } catch {
    return false;
  }
}
