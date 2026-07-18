import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { httpResource } from '@angular/common/http';
import type { StatusReportDto } from '@double-o/shared';
import { AgentSilhouette } from './agent-silhouette';
import { LanguageService } from './language.service';
import { SoundService } from './sound.service';
import { MissionService } from './mission/mission.service';
import { MissionAnalytics } from './mission/mission-analytics';
import { MissionFeed } from './mission/mission-feed';
import { MissionHistory } from './mission/mission-history';
import { GunBarrel } from './intro/gun-barrel';

@Component({
  selector: 'app-root',
  imports: [AgentSilhouette, MissionAnalytics, MissionFeed, MissionHistory, GunBarrel],
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

  protected toggleMode(): void {
    this.mode.update((m) => (m === 'live' ? 'demo' : 'live'));
  }

  protected onDossierSelected(input: HTMLInputElement): void {
    const file = input.files?.[0];
    // Reset so picking the same file again re-fires the change event.
    input.value = '';
    if (file) {
      this.mission.startExtraction(file, this.demoMode());
    }
  }
}
