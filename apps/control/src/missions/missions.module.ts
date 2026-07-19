import { Module } from '@nestjs/common';
import { AgentModule } from '../agent/agent.module';
import { PrismaModule } from '../prisma/prisma.module';
import { InvoicesModule } from '../invoices/invoices.module';
import { MissionsController } from './missions.controller';
import { MissionsService } from './missions.service';
import { MissionsRepository } from './missions.repository';
import { PdfTextService } from './pdf-text.service';
import { RetentionService } from './retention.service';

@Module({
  imports: [AgentModule, PrismaModule, InvoicesModule],
  controllers: [MissionsController],
  providers: [
    MissionsService,
    MissionsRepository,
    PdfTextService,
    RetentionService,
  ],
})
export class MissionsModule {}
