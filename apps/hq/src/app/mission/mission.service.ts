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
  /**
   * Translation key for the pre-stream phase — upload, PDF parsing, and the wait
   * for the first event — cleared the moment events start flowing or the run ends.
   * Fills the dead air a dossier upload would otherwise show.
   */
  readonly preparing = signal<TranslationKey | undefined>(undefined);
  /** Translation key for the current link failure, if any — the view renders it in the active language. */
  readonly linkError = signal<TranslationKey | undefined>(undefined);
  /** Bumped when a mission ends — history views reload on it. */
  readonly finishedCount = signal(0);

  start(demo = false): void {
    const body: StartMissionRequestDto = { type: 'duplicate-hunt', demo };
    this.launch(
      this.http.post<StartMissionResponseDto>('/api/missions', body),
      'errStartMission',
      'preparingMission',
    );
  }

  /** Uploads a PDF and follows the extraction mission it starts. */
  startExtraction(file: File, demo = false): void {
    const form = new FormData();
    form.append('file', file, file.name);
    form.append('demo', String(demo));
    this.launch(
      this.http.post<StartMissionResponseDto>('/api/missions/extract', form),
      'errDossierRejected',
      'preparingDossier',
    );
  }

  private launch(
    request: Observable<StartMissionResponseDto>,
    failureMessage: TranslationKey,
    preparingMessage: TranslationKey,
  ): void {
    if (this.running()) {
      return;
    }
    this.close();
    this.events.set([]);
    this.linkError.set(undefined);
    this.running.set(true);
    this.preparing.set(preparingMessage);

    request.subscribe({
      next: ({ missionId }) => this.listen(missionId),
      error: () => {
        this.running.set(false);
        this.preparing.set(undefined);
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
        this.preparing.set(undefined);
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
      this.preparing.set(undefined);
      this.close();
    };
  }

  private close(): void {
    this.source?.close();
    this.source = undefined;
  }
}
