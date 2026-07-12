import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
} from '@angular/core';
import { httpResource } from '@angular/common/http';
import type {
  GadgetUsageDto,
  MissionAnalyticsDto,
  MissionTypeStatsDto,
} from '@double-o/shared';
import { MissionService } from './mission.service';
import { StatValue } from './stat-value';

@Component({
  selector: 'app-mission-analytics',
  imports: [StatValue],
  templateUrl: './mission-analytics.html',
  styleUrl: './mission-analytics.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MissionAnalytics {
  private readonly mission = inject(MissionService);

  protected readonly stats = httpResource<MissionAnalyticsDto>(
    () => '/api/missions/analytics',
  );

  constructor() {
    effect(() => {
      if (this.mission.finishedCount() > 0) {
        this.stats.reload();
      }
    });
  }

  protected readonly formatPercent = (n: number): string => `${Math.round(n)}%`;
  protected readonly formatDuration = (ms: number): string => this.duration(ms);

  protected duration(ms?: number): string {
    if (ms === undefined) {
      return '—';
    }
    const seconds = Math.round(ms / 1000);
    return seconds < 60
      ? `${seconds} s`
      : `${Math.floor(seconds / 60)} min ${seconds % 60} s`;
  }

  protected typeWidth(row: MissionTypeStatsDto, list: MissionTypeStatsDto[]): string {
    return `${(row.total / Math.max(...list.map((t) => t.total))) * 100}%`;
  }

  protected gadgetWidth(row: GadgetUsageDto, list: GadgetUsageDto[]): string {
    return `${(row.calls / Math.max(...list.map((g) => g.calls))) * 100}%`;
  }
}
