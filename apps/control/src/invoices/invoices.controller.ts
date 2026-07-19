import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Inject,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import type {
  StoredInvoiceDto,
  UploadInvoicesResultDto,
} from '@double-o/shared';
import { InvoiceIngestService } from './invoice-ingest.service';
import { InvoiceArchiveRepository } from './invoice-archive.repository';
import { PdfTextService } from '../missions/pdf-text.service';
import { OwnerId } from '../session/owner-id.decorator';
import { LLM_LIVE_AVAILABLE } from '../agent/llm.service';
import {
  isPdf,
  MAX_PDF_BYTES,
  sanitizeFilename,
} from '../common/pdf-upload.util';

/** Each uploaded PDF runs a live LLM extraction, so keep the batch small per request. */
const MAX_FILES = 5;

@Controller('invoices')
export class InvoicesController {
  constructor(
    private readonly ingest: InvoiceIngestService,
    private readonly archive: InvoiceArchiveRepository,
    private readonly pdfText: PdfTextService,
    @Inject(LLM_LIVE_AVAILABLE) private readonly liveAvailable: boolean,
  ) {}

  // Each file triggers a paid LLM extraction — tighten well below the default.
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Post()
  @UseInterceptors(
    FilesInterceptor('files', MAX_FILES, {
      limits: { fileSize: MAX_PDF_BYTES },
    }),
  )
  async upload(
    @OwnerId() ownerId: string,
    @UploadedFiles() files?: Express.Multer.File[],
  ): Promise<UploadInvoicesResultDto> {
    if (!this.liveAvailable) {
      throw new BadRequestException(
        'Live extraction needs an OpenAI key. Switch to demo mode to hunt the sample batch.',
      );
    }
    if (!files?.length) {
      throw new BadRequestException(
        'Upload at least one PDF in the "files" field.',
      );
    }

    let added = 0;
    const skipped: { filename: string; reason: string }[] = [];
    // Sequential: extraction is a paid LLM call and order keeps INV codes stable.
    for (const file of files) {
      const filename = sanitizeFilename(file.originalname);
      try {
        if (!isPdf(file.buffer)) {
          skipped.push({ filename, reason: 'not a valid PDF' });
          continue;
        }
        const text = await this.pdfText.extract(file.buffer);
        const stored = await this.ingest.ingest(ownerId, { filename, text });
        if (stored) {
          added++;
        } else {
          skipped.push({ filename, reason: 'not an invoice' });
        }
      } catch (err) {
        skipped.push({
          filename,
          reason: err instanceof Error ? err.message : 'could not read PDF',
        });
      }
    }
    return { added, skipped };
  }

  @Get()
  list(@OwnerId() ownerId: string): Promise<StoredInvoiceDto[]> {
    return this.archive.listByOwner(ownerId);
  }

  @Delete()
  async clear(@OwnerId() ownerId: string): Promise<{ cleared: number }> {
    return { cleared: await this.archive.clearByOwner(ownerId) };
  }
}
