import {
  Body,
  Controller,
  MessageEvent,
  Param,
  Post,
  Sse,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import type {
  StartMissionRequestDto,
  StartMissionResponseDto,
} from '@double-o/shared';
import { MissionsService } from './missions.service';

@Controller('missions')
export class MissionsController {
  constructor(private readonly missions: MissionsService) {}

  @Post()
  start(@Body() body: StartMissionRequestDto): StartMissionResponseDto {
    return this.missions.start(body.type);
  }

  @Sse(':id/feed')
  feed(@Param('id') id: string): Observable<MessageEvent> {
    return this.missions
      .eventStream(id)
      .pipe(map((ev) => ({ type: ev.type, data: ev })));
  }
}
