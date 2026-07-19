import { Inject, Injectable } from '@nestjs/common';
import type { StatusReportDto } from '@double-o/shared';
import { LLM_LIVE_AVAILABLE } from './agent/llm.service';

@Injectable()
export class AppService {
  constructor(
    @Inject(LLM_LIVE_AVAILABLE) private readonly llmAvailable: boolean,
  ) {}

  statusReport(): StatusReportDto {
    return {
      codename: 'control',
      status: 'operational',
      message: 'Control operativo. In attesa della prossima missione.',
      reportedAt: new Date().toISOString(),
      llmAvailable: this.llmAvailable,
    };
  }
}
