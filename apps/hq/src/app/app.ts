import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { httpResource } from '@angular/common/http';
import type { StatusReportDto, StoredInvoiceDto } from '@double-o/shared';
import { AgentSilhouette } from './agent-silhouette';
import { LanguageService } from './language.service';
import { SoundService } from './sound.service';
import { MissionService } from './mission/mission.service';
import { MissionAnalytics } from './mission/mission-analytics';
import { MissionFeed } from './mission/mission-feed';
import { MissionHistory } from './mission/mission-history';
import { InvoiceBatch } from './mission/invoice-batch';
import { GunBarrel } from './intro/gun-barrel';

@Component({
  selector: 'app-root',
  imports: [AgentSilhouette, MissionAnalytics, MissionFeed, MissionHistory, InvoiceBatch, GunBarrel],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  protected readonly controlStatus = httpResource<StatusReportDto>(() => '/api/status');
  protected readonly mission = inject(MissionService);
  protected readonly sound = inject(SoundService);
  protected readonly language = inject(LanguageService);
  protected readonly introDone = signal(false);

  /** Live missions need a configured key; assume available until Control says otherwise. */
  protected readonly liveAvailable = computed(
    () => this.controlStatus.value()?.llmAvailable !== false,
  );
  private readonly mode = signal<'live' | 'demo'>('live');
  /** Falls back to demo when no live brain is configured, regardless of the toggle. */
  protected readonly effectiveMode = computed(() =>
    this.liveAvailable() ? this.mode() : 'demo',
  );
  protected readonly demoMode = computed(() => this.effectiveMode() === 'demo');

  /** The session's uploaded invoice batch — only fetched in live mode. */
  protected readonly batch = httpResource<StoredInvoiceDto[]>(() =>
    this.effectiveMode() === 'live' ? '/api/invoices' : undefined,
  );
  protected readonly batchEmpty = computed(
    () => (this.batch.value()?.length ?? 0) === 0,
  );

  constructor() {
    // Reload the batch whenever an upload or clear changes it.
    effect(() => {
      if (this.mission.batchCount() > 0) {
        this.batch.reload();
      }
    });
  }

  protected toggleMode(): void {
    this.mode.update((m) => (m === 'live' ? 'demo' : 'live'));
  }

  protected onInvoicesSelected(input: HTMLInputElement): void {
    const files = input.files;
    // Reset so picking the same files again re-fires the change event.
    input.value = '';
    if (files?.length) {
      this.mission.uploadInvoices(files);
    }
  }
}
