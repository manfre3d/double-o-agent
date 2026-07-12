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
import { SoundService } from '../sound.service';
import { GadgetTransmission } from './gadget-transmission';
import { TypewriterText } from './typewriter-text';
import { formatInvoiceAmount } from './format-amount';

/** How close (px) the feed's tail must sit to the viewport bottom to keep following. */
const FOLLOW_SLACK_PX = 120;

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
    afterNextRender(() => {
      if (this.instant() || typeof ResizeObserver !== 'function') {
        return;
      }
      const el = this.list().nativeElement;
      let engaged = true;
      let lastY = window.scrollY;
      let lastHeight = el.getBoundingClientRect().height;
      // Any upward scroll is the reader stepping away — geometry alone can't
      // tell that intent, since early in a mission even the page top is
      // "near" the tail. Following resumes once they scroll back down within
      // reach of the tail. Our own pins only ever scroll down, so an upward
      // move is always the user's.
      onScroll = () => {
        const y = window.scrollY;
        engaged =
          y < lastY
            ? false
            : el.getBoundingClientRect().bottom <= window.innerHeight + FOLLOW_SLACK_PX;
        lastY = y;
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      followObserver = new ResizeObserver(() => {
        const rect = el.getBoundingClientRect();
        const delta = rect.height - lastHeight;
        lastHeight = rect.height;
        // Follow growth only, and only once the tail has left the viewport.
        if (delta > 0 && engaged && rect.bottom > window.innerHeight) {
          el.scrollIntoView({ block: 'end', behavior: 'auto' });
        }
      });
      followObserver.observe(el);
    });
    inject(DestroyRef).onDestroy(() => {
      followObserver?.disconnect();
      if (onScroll) {
        window.removeEventListener('scroll', onScroll);
      }
    });
  }
}
