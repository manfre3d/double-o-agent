import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MissionsRepository } from './missions.repository';

const DEFAULT_RETENTION_HOURS = 72;

/**
 * Data minimization: missions (and, via cascade, their events — which embed the
 * uploaded document text) are swept once they age past the retention window, so
 * user-provided data does not linger indefinitely. Also clears the pre-isolation
 * `legacy` rows on first run.
 */
@Injectable()
export class RetentionService {
  private readonly logger = new Logger(RetentionService.name);
  private readonly retentionMs: number;

  constructor(
    private readonly repo: MissionsRepository,
    config: ConfigService,
  ) {
    const hours =
      Number(config.get('MISSION_RETENTION_HOURS')) || DEFAULT_RETENTION_HOURS;
    this.retentionMs = hours * 60 * 60 * 1000;
  }

  @Cron(CronExpression.EVERY_HOUR)
  async purge(): Promise<void> {
    const cutoff = new Date(Date.now() - this.retentionMs);
    const removed = await this.repo.deleteOlderThan(cutoff);
    if (removed > 0) {
      this.logger.log(
        `Retention: purged ${removed} mission(s) started before ${cutoff.toISOString()}`,
      );
    }
  }
}
