import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Observable, ReplaySubject } from 'rxjs';
import type {
  MissionEvent,
  MissionType,
  StartMissionResponseDto,
} from '@double-o/shared';
import {
  AgentLoopService,
  MissionEventDraft,
} from '../agent/agent-loop.service';

interface MissionRun {
  id: string;
  code: string;
  /** Replay so a feed subscriber connecting after launch still sees every event. */
  events: ReplaySubject<MissionEvent>;
  seq: number;
}

const MISSION_BRIEFS: Record<
  MissionType,
  { title: string; objective: string; task: string }
> = {
  'duplicate-hunt': {
    title: 'Caccia ai doppioni',
    objective:
      'Individuare e segnalare le fatture registrate due volte nel lotto corrente.',
    task: 'Begin the duplicate hunt on the current invoice batch.',
  },
};

@Injectable()
export class MissionsService {
  private readonly runs = new Map<string, MissionRun>();
  private counter = 0;

  constructor(private readonly agentLoop: AgentLoopService) {}

  start(type: MissionType): StartMissionResponseDto {
    const brief = MISSION_BRIEFS[type];
    if (!brief) {
      throw new NotFoundException(`Unknown mission type: ${String(type)}`);
    }

    const run: MissionRun = {
      id: randomUUID(),
      code: `007-${String(++this.counter).padStart(3, '0')}`,
      events: new ReplaySubject<MissionEvent>(),
      seq: 0,
    };
    this.runs.set(run.id, run);

    const emit = (draft: MissionEventDraft) => {
      run.events.next({
        ...draft,
        missionId: run.id,
        seq: run.seq++,
        at: new Date().toISOString(),
      });
    };

    void this.agentLoop
      .run({ missionId: run.id, code: run.code, ...brief }, emit)
      .catch((err: unknown) => {
        emit({
          type: 'error',
          message: `Missione fallita: ${err instanceof Error ? err.message : String(err)}`,
        });
      })
      .finally(() => run.events.complete());

    return { missionId: run.id, code: run.code };
  }

  eventStream(missionId: string): Observable<MissionEvent> {
    const run = this.runs.get(missionId);
    if (!run) {
      throw new NotFoundException(`Unknown mission: ${missionId}`);
    }
    return run.events.asObservable();
  }
}
