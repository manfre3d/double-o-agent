import {
  Body,
  Controller,
  Get,
  MessageEvent,
  Param,
  Post,
  Sse,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import type {
  MissionEvent,
  MissionSummaryDto,
  StartMissionRequestDto,
  StartMissionResponseDto,
} from '@double-o/shared';
import { MissionsService } from './missions.service';

@Controller('missions')
export class MissionsController {
  constructor(private readonly missions: MissionsService) {}

  @Post()
  start(
    @Body() body: StartMissionRequestDto,
  ): Promise<StartMissionResponseDto> {
    return this.missions.start(body.type);
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
