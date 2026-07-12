import { ChangeDetectionStrategy, Component, effect, inject, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import type { MissionEvent } from '@double-o/shared';
import { SoundService } from '../sound.service';
import { GadgetTransmission } from './gadget-transmission';
import { TypewriterText } from './typewriter-text';
import { formatInvoiceAmount } from './format-amount';

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
  }
}
