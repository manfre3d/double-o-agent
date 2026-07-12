import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  effect,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import type { MissionEvent } from '@double-o/shared';
import { LanguageService } from '../language.service';
import { motionOk } from '../motion';
import { SoundService } from '../sound.service';
import { GadgetTransmission } from './gadget-transmission';
import { TypewriterText } from './typewriter-text';
import { formatInvoiceAmount } from './format-amount';

/** How close (px) the feed's tail must sit to the viewport bottom to keep following. */
const FOLLOW_SLACK_PX = 120;
/** Breathing room under the followed tail — mirrors the list's scroll-margin-block-end (--space-4). */
const TAIL_MARGIN_PX = 32;
/** Fraction of the remaining gap the eased follow closes per 60fps frame. */
const FOLLOW_EASE = 0.1;
/**
 * Velocity ceiling (px per frame). Without it, a large append — or the
 * dt-normalized alpha compensating after a main-thread jank — closes most
 * of the gap in one frame: a teleport again.
 */
const FOLLOW_MAX_STEP_PX = 32;

@Component({
  selector: 'app-mission-feed',
  imports: [DatePipe, GadgetTransmission, TypewriterText],
  templateUrl: './mission-feed.html',
  styleUrl: './mission-feed.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MissionFeed {
  readonly events = input.required<MissionEvent[]>();
  /** Skips the typewriter — used when replaying archived transcripts. */
  readonly instant = input(false);

  protected readonly amount = formatInvoiceAmount;
  protected readonly language = inject(LanguageService);

  private readonly list = viewChild.required<ElementRef<HTMLOListElement>>('list');

  constructor() {
    const sound = inject(SoundService);
    let lastSeq = -1;
    effect(() => {
      const events = this.events();
      if (!events.length) {
        lastSeq = -1;
        return;
      }
      const latest = events[events.length - 1];
      if (this.instant() || latest.seq <= lastSeq) {
        return;
      }
      lastSeq = latest.seq;
      if (latest.type === 'gadget_call') {
        sound.relayClick();
      } else if (latest.type === 'debrief') {
        sound.stampThunk();
      }
    });

    // Keep the growing tail in view during a live mission. A ResizeObserver
    // sees every height change — appended events and typewriter line-wraps
    // alike — where an effect on events() would miss the typing. DOM-only,
    // so it is safe outside change detection.
    let followObserver: ResizeObserver | undefined;
    let onScroll: (() => void) | undefined;
    let stopFollow: (() => void) | undefined;
    afterNextRender(() => {
      if (this.instant() || typeof ResizeObserver !== 'function') {
        return;
      }
      const el = this.list().nativeElement;
      let engaged = true;
      let lastY = window.scrollY;
      let lastHeight = el.getBoundingClientRect().height;
      // Growth is chased with an eased glide, not an instant pin: each frame
      // closes a fraction of the gap to the tail, so typewriter line-wraps
      // chain into one continuous scroll. The goal is recomputed every frame,
      // so mid-glide growth steers the motion instead of restarting it.
      let rafId: number | undefined;
      let lastFrameTime: number | undefined;
      let expectedY = Number.NaN;
      stopFollow = () => {
        if (rafId !== undefined) {
          cancelAnimationFrame(rafId);
          rafId = undefined;
        }
        lastFrameTime = undefined;
      };
      const step = (now: number) => {
        rafId = undefined;
        if (!engaged) {
          lastFrameTime = undefined;
          return;
        }
        const y = window.scrollY;
        const goal = Math.min(
          y + el.getBoundingClientRect().bottom - window.innerHeight + TAIL_MARGIN_PX,
          document.documentElement.scrollHeight - window.innerHeight,
        );
        if (goal - y < 1) {
          lastFrameTime = undefined;
          return;
        }
        const dt = lastFrameTime === undefined ? 16.7 : now - lastFrameTime;
        lastFrameTime = now;
        // dt-normalized so the glide converges at one speed on any refresh rate.
        const alpha = 1 - Math.pow(1 - FOLLOW_EASE, dt / 16.7);
        window.scrollTo(0, y + Math.min((goal - y) * alpha, FOLLOW_MAX_STEP_PX));
        expectedY = window.scrollY; // re-read — the browser may clamp or round
        rafId = requestAnimationFrame(step);
      };
      const startFollow = () => {
        rafId ??= requestAnimationFrame(step);
      };
      // Any upward scroll is the reader stepping away — geometry alone can't
      // tell that intent, since early in a mission even the page top is
      // "near" the tail. Following resumes once they scroll back down within
      // reach of the tail. Our own glide frames land exactly on expectedY and
      // are skipped here; anything else is the user's, and the glide only
      // ever scrolls down, so an upward move is always theirs.
      onScroll = () => {
        const y = window.scrollY;
        if (Math.abs(y - expectedY) <= 1) {
          lastY = y;
          return;
        }
        if (y < lastY) {
          engaged = false;
          stopFollow?.();
        } else {
          engaged = el.getBoundingClientRect().bottom <= window.innerHeight + FOLLOW_SLACK_PX;
        }
        lastY = y;
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      followObserver = new ResizeObserver(() => {
        const rect = el.getBoundingClientRect();
        const delta = rect.height - lastHeight;
        lastHeight = rect.height;
        // Follow growth only, and only once the tail has left the viewport.
        if (delta > 0 && engaged && rect.bottom > window.innerHeight) {
          if (motionOk()) {
            startFollow();
          } else {
            // Reduced motion: the typewriter renders whole events at once,
            // so the follow collapses to the same instant pin.
            el.scrollIntoView({ block: 'end', behavior: 'auto' });
          }
        }
      });
      followObserver.observe(el);
    });
    inject(DestroyRef).onDestroy(() => {
      followObserver?.disconnect();
      stopFollow?.();
      if (onScroll) {
        window.removeEventListener('scroll', onScroll);
      }
    });
  }
}
