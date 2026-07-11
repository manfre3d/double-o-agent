import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { httpResource } from '@angular/common/http';
import type { StatusReportDto } from '@double-o/shared';
import { MissionService } from './mission/mission.service';
import { MissionFeed } from './mission/mission-feed';

@Component({
  selector: 'app-root',
  imports: [MissionFeed],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  protected readonly controlStatus = httpResource<StatusReportDto>(() => '/api/status');
  protected readonly mission = inject(MissionService);
}
