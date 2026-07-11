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

@Component({
  selector: 'app-mission-analytics',
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

  protected successRate(report: MissionAnalyticsDto): string {
    return report.successRate === undefined
      ? '—'
      : `${Math.round(report.successRate * 100)}%`;
  }

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
