import { Controller, Get } from '@nestjs/common';
import type { StatusReportDto } from '@double-o/shared';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('status')
  getStatus(): StatusReportDto {
    return this.appService.statusReport();
  }
}
