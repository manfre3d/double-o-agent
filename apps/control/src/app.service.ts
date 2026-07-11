import { Injectable } from '@nestjs/common';
import type { StatusReportDto } from '@double-o/shared';

@Injectable()
export class AppService {
  statusReport(): StatusReportDto {
    return {
      codename: 'control',
      status: 'operational',
      message: 'Control operativo. In attesa della prossima missione.',
      reportedAt: new Date().toISOString(),
    };
  }
}
