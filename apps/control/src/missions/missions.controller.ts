import {
  BadRequestException,
  Body,
  Controller,
  Get,
  MessageEvent,
  Param,
  Post,
  Sse,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { Observable, map } from 'rxjs';
import type {
  MissionAnalyticsDto,
  MissionEvent,
  MissionSummaryDto,
  StartMissionRequestDto,
  StartMissionResponseDto,
} from '@double-o/shared';
import { MissionsService } from './missions.service';
import { PdfTextService } from './pdf-text.service';
import { OwnerId } from '../session/owner-id.decorator';

const MAX_PDF_BYTES = 10 * 1024 * 1024;
/** Every PDF starts with this signature; the client-sent mimetype is not trusted. */
const PDF_MAGIC = Buffer.from('%PDF-');

/** The upload filename is untrusted input (shown in the UI, fed to the LLM brief):
 *  drop path separators and control chars, and cap the length. */
function sanitizeFilename(name: string): string {
  return (
    name
      .replace(/[/\\]/g, '_')
      .replace(/\p{Cc}/gu, ' ')
      .trim()
      .slice(0, 100) || 'dossier.pdf'
  );
}

@Controller('missions')
export class MissionsController {
  constructor(
    private readonly missions: MissionsService,
    private readonly pdfText: PdfTextService,
  ) {}

  // Starting a mission triggers a paid LLM run — tighten well below the default.
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Post()
  start(
    @Body() body: StartMissionRequestDto,
    @OwnerId() ownerId: string,
  ): Promise<StartMissionResponseDto> {
    return this.missions.start(body.type, ownerId, body.demo ?? false);
  }

  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Post('extract')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_PDF_BYTES } }),
  )
  async extract(
    @OwnerId() ownerId: string,
    // Multipart text fields arrive as strings (no global ValidationPipe/transform).
    @Body() body: { demo?: string },
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<StartMissionResponseDto> {
    if (!file || !file.buffer.subarray(0, PDF_MAGIC.length).equals(PDF_MAGIC)) {
      throw new BadRequestException('Upload a valid PDF in the "file" field.');
    }
    const text = await this.pdfText.extract(file.buffer);
    return this.missions.startExtraction(
      { filename: sanitizeFilename(file.originalname), text },
      ownerId,
      body?.demo === 'true',
    );
  }

  @Get()
  list(@OwnerId() ownerId: string): Promise<MissionSummaryDto[]> {
    return this.missions.history(ownerId);
  }

  @Get('analytics')
  analytics(@OwnerId() ownerId: string): Promise<MissionAnalyticsDto> {
    return this.missions.analytics(ownerId);
  }

  @Get(':id/events')
  events(
    @Param('id') id: string,
    @OwnerId() ownerId: string,
  ): Promise<MissionEvent[]> {
    return this.missions.storedEvents(id, ownerId);
  }

  @Sse(':id/feed')
  feed(
    @Param('id') id: string,
    @OwnerId() ownerId: string,
  ): Observable<MessageEvent> {
    return this.missions
      .eventStream(id, ownerId)
      .pipe(map((ev) => ({ type: ev.type, data: ev })));
  }
}
