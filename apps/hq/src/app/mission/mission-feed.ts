import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { JsonPipe } from '@angular/common';
import type { MissionEvent } from '@double-o/shared';

@Component({
  selector: 'app-mission-feed',
  imports: [JsonPipe],
  templateUrl: './mission-feed.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MissionFeed {
  readonly events = input.required<MissionEvent[]>();
}
