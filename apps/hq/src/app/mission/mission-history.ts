import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import type { MissionEvent, MissionStatus, MissionSummaryDto } from '@double-o/shared';
import { injectViewTransition } from '../view-transition';
import { MissionService } from './mission.service';
import { MissionFeed } from './mission-feed';
import { formatInvoiceAmount } from './format-amount';

const STATUS_LABELS: Record<MissionStatus, string> = {
  running: 'IN CORSO',
  completed: 'COMPLETATA',
  failed: 'FALLITA',
};

/** Stamp inked onto the dossier card face, per mission status. */
const STAMP_LABELS: Record<MissionStatus, string> = {
  running: 'In corso',
  completed: 'Top secret',
  failed: 'Fallita',
};

@Component({
  selector: 'app-mission-history',
  imports: [DatePipe, MissionFeed],
  templateUrl: './mission-history.html',
  styleUrl: './mission-history.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MissionHistory {
  private readonly mission = inject(MissionService);

  protected readonly missions = httpResource<MissionSummaryDto[]>(() => '/api/missions');
  protected readonly openId = signal<string | undefined>(undefined);
  protected readonly openEvents = httpResource<MissionEvent[]>(() => {
    const id = this.openId();
    return id ? `/api/missions/${id}/events` : undefined;
  });

  constructor() {
    effect(() => {
      if (this.mission.finishedCount() > 0) {
        this.missions.reload();
      }
    });
  }

  protected statusLabel(status: MissionStatus): string {
    return STATUS_LABELS[status];
  }

  protected readonly amount = formatInvoiceAmount;

  protected stampLabel(status: MissionStatus): string {
    return STAMP_LABELS[status];
  }

  private readonly withViewTransition = injectViewTransition();

  protected toggle(missionId: string): void {
    this.withViewTransition(() => {
      this.openId.update((current) => (current === missionId ? undefined : missionId));
    });
  }
}
