import { Module } from '@nestjs/common';
import { AgentModule } from '../agent/agent.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PdfTextService } from '../missions/pdf-text.service';
import { InvoicesController } from './invoices.controller';
import { InvoiceIngestService } from './invoice-ingest.service';
import { InvoiceArchiveRepository } from './invoice-archive.repository';

@Module({
  imports: [PrismaModule, AgentModule],
  controllers: [InvoicesController],
  providers: [InvoiceIngestService, InvoiceArchiveRepository, PdfTextService],
  exports: [InvoiceArchiveRepository],
})
export class InvoicesModule {}
