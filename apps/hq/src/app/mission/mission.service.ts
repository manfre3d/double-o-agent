import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import type { Observable } from 'rxjs';
import {
  MISSION_EVENT_TYPES,
  type MissionEvent,
  type StartMissionRequestDto,
  type StartMissionResponseDto,
} from '@double-o/shared';
import type { TranslationKey } from '../i18n/translations';

@Injectable({ providedIn: 'root' })
export class MissionService {
  private readonly http = inject(HttpClient);
  private source: EventSource | undefined;

  readonly events = signal<MissionEvent[]>([]);
  readonly running = signal(false);
  /** Translation key for the current link failure, if any — the view renders it in the active language. */
  readonly linkError = signal<TranslationKey | undefined>(undefined);
  /** Bumped when a mission ends — history views reload on it. */
  readonly finishedCount = signal(0);

  start(): void {
    const body: StartMissionRequestDto = { type: 'duplicate-hunt' };
    this.launch(
      this.http.post<StartMissionResponseDto>('/api/missions', body),
      'errStartMission',
    );
  }

  /** Uploads a PDF and follows the extraction mission it starts. */
  startExtraction(file: File): void {
    const form = new FormData();
    form.append('file', file, file.name);
    this.launch(
      this.http.post<StartMissionResponseDto>('/api/missions/extract', form),
      'errDossierRejected',
    );
  }

  private launch(
    request: Observable<StartMissionResponseDto>,
    failureMessage: TranslationKey,
  ): void {
    if (this.running()) {
      return;
    }
    this.close();
    this.events.set([]);
    this.linkError.set(undefined);
    this.running.set(true);

    request.subscribe({
      next: ({ missionId }) => this.listen(missionId),
      error: () => {
        this.running.set(false);
        this.linkError.set(failureMessage);
      },
    });
  }

  private listen(missionId: string): void {
    const source = new EventSource(`/api/missions/${missionId}/feed`);
    this.source = source;

    for (const type of MISSION_EVENT_TYPES) {
      source.addEventListener(type, (msg) => {
        const event = JSON.parse((msg as MessageEvent<string>).data) as MissionEvent;
        this.events.update((list) => [...list, event]);
        if (event.type === 'debrief' || event.type === 'error') {
          this.running.set(false);
          this.close();
          this.finishedCount.update((n) => n + 1);
        }
      });
    }

    // EventSource auto-reconnects on stream end; a mission stream is one-shot,
    // so any error while still running means the link is gone.
    source.onerror = () => {
      if (this.running()) {
        this.running.set(false);
        this.linkError.set('errLinkInterrupted');
      }
      this.close();
    };
  }

  private close(): void {
    this.source?.close();
    this.source = undefined;
  }
}
