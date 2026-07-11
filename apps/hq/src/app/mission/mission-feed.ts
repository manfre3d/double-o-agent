import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DatePipe, JsonPipe } from '@angular/common';
import type { MissionEvent } from '@double-o/shared';
import { TypewriterText } from './typewriter-text';

@Component({
  selector: 'app-mission-feed',
  imports: [DatePipe, JsonPipe, TypewriterText],
  templateUrl: './mission-feed.html',
  styleUrl: './mission-feed.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MissionFeed {
  readonly events = input.required<MissionEvent[]>();
  /** Skips the typewriter — used when replaying archived transcripts. */
  readonly instant = input(false);

  protected compact(params: Record<string, unknown>): string {
    return JSON.stringify(params);
  }
}
