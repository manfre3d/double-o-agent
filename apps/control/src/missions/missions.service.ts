import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Observable, ReplaySubject } from 'rxjs';
import type {
  MissionEvent,
  MissionSummaryDto,
  MissionType,
  StartMissionResponseDto,
} from '@double-o/shared';
import {
  AgentLoopService,
  MissionEventDraft,
} from '../agent/agent-loop.service';
import { MissionsRepository } from './missions.repository';

interface MissionRun {
  id: string;
  code: string;
  /** Replay so a feed subscriber connecting after launch still sees every event. */
  events: ReplaySubject<MissionEvent>;
  seq: number;
  last?: MissionEvent;
  /** Serialized event writes, so DB order matches stream order. */
  persist: Promise<void>;
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
  private readonly logger = new Logger(MissionsService.name);
  /** Live runs only (process lifetime); finished missions are read from the DB. */
  private readonly runs = new Map<string, MissionRun>();

  constructor(
    private readonly agentLoop: AgentLoopService,
    private readonly repo: MissionsRepository,
  ) {}

  async start(type: MissionType): Promise<StartMissionResponseDto> {
    const brief = MISSION_BRIEFS[type];
    if (!brief) {
      throw new NotFoundException(`Unknown mission type: ${String(type)}`);
    }

    const run: MissionRun = {
      id: randomUUID(),
      code: `007-${String(await this.repo.nextCodeNumber()).padStart(3, '0')}`,
      events: new ReplaySubject<MissionEvent>(),
      seq: 0,
      persist: Promise.resolve(),
    };
    await this.repo.create({ id: run.id, code: run.code, type });
    this.runs.set(run.id, run);

    const emit = (draft: MissionEventDraft) => {
      const event: MissionEvent = {
        ...draft,
        missionId: run.id,
        seq: run.seq++,
        at: new Date().toISOString(),
      };
      run.last = event;
      run.events.next(event);
      run.persist = run.persist
        .then(() => this.repo.appendEvent(event))
        .catch((err: unknown) =>
          this.logger.error(`Failed to persist event ${event.seq}`, err),
        );
    };

    void this.agentLoop
      .run({ missionId: run.id, code: run.code, ...brief }, emit)
      .catch((err: unknown) => {
        emit({
          type: 'error',
          message: `Missione fallita: ${err instanceof Error ? err.message : String(err)}`,
        });
      })
      .finally(() => void this.finalize(run));

    return { missionId: run.id, code: run.code };
  }

  private async finalize(run: MissionRun): Promise<void> {
    try {
      await run.persist;
      const debrief = run.last?.type === 'debrief' ? run.last : undefined;
      await this.repo.finish(run.id, {
        status: debrief ? 'completed' : 'failed',
        debrief: debrief?.text,
        flagged: debrief?.flagged ?? [],
      });
    } catch (err) {
      this.logger.error(`Failed to finalize mission ${run.code}`, err);
    } finally {
      run.events.complete();
    }
  }

  /** Live SSE stream; finished missions are served by storedEvents instead. */
  eventStream(missionId: string): Observable<MissionEvent> {
    const run = this.runs.get(missionId);
    if (!run) {
      throw new NotFoundException(`Unknown mission: ${missionId}`);
    }
    return run.events.asObservable();
  }

  async history(): Promise<MissionSummaryDto[]> {
    const summaries = await this.repo.list();
    return summaries.map((summary) => ({
      ...summary,
      title: MISSION_BRIEFS[summary.type]?.title ?? summary.type,
    }));
  }

  async storedEvents(missionId: string): Promise<MissionEvent[]> {
    if (!(await this.repo.exists(missionId))) {
      throw new NotFoundException(`Unknown mission: ${missionId}`);
    }
    return this.repo.getEvents(missionId);
  }
}
