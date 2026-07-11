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
import { Observable, map } from 'rxjs';
import type {
  MissionEvent,
  MissionSummaryDto,
  StartMissionRequestDto,
  StartMissionResponseDto,
} from '@double-o/shared';
import { MissionsService } from './missions.service';
import { PdfTextService } from './pdf-text.service';

const MAX_PDF_BYTES = 10 * 1024 * 1024;

@Controller('missions')
export class MissionsController {
  constructor(
    private readonly missions: MissionsService,
    private readonly pdfText: PdfTextService,
  ) {}

  @Post()
  start(
    @Body() body: StartMissionRequestDto,
  ): Promise<StartMissionResponseDto> {
    return this.missions.start(body.type);
  }

  @Post('extract')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_PDF_BYTES } }),
  )
  async extract(
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<StartMissionResponseDto> {
    if (!file || file.mimetype !== 'application/pdf') {
      throw new BadRequestException('Upload a PDF in the "file" field.');
    }
    const text = await this.pdfText.extract(file.buffer);
    return this.missions.startExtraction({
      filename: file.originalname,
      text,
    });
  }

  @Get()
  list(): Promise<MissionSummaryDto[]> {
    return this.missions.history();
  }

  @Get(':id/events')
  events(@Param('id') id: string): Promise<MissionEvent[]> {
    return this.missions.storedEvents(id);
  }

  @Sse(':id/feed')
  feed(@Param('id') id: string): Observable<MessageEvent> {
    return this.missions
      .eventStream(id)
      .pipe(map((ev) => ({ type: ev.type, data: ev })));
  }
}
