import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Observable, ReplaySubject } from 'rxjs';
import type {
  MissionAnalyticsDto,
  MissionEvent,
  MissionSummaryDto,
  MissionType,
  MissionTypeStatsDto,
  StartMissionResponseDto,
} from '@double-o/shared';
import {
  AgentLoopService,
  MissionEventDraft,
} from '../agent/agent-loop.service';
import { MissionDocument } from '../gadgets/gadget.interface';
import {
  extractionBrief,
  MISSION_BRIEFS,
  MISSION_TITLES,
  MissionBrief,
} from './mission-briefs';
import { MissionsRepository } from './missions.repository';

interface MissionRun {
  id: string;
  ownerId: string;
  code: string;
  /** Replay so a feed subscriber connecting after launch still sees every event. */
  events: ReplaySubject<MissionEvent>;
  seq: number;
  last?: MissionEvent;
  /** Serialized event writes, so DB order matches stream order. */
  persist: Promise<void>;
}

@Injectable()
export class MissionsService {
  private readonly logger = new Logger(MissionsService.name);
  /** Live runs only (process lifetime); finished missions are read from the DB. */
  private readonly runs = new Map<string, MissionRun>();

  constructor(
    private readonly agentLoop: AgentLoopService,
    private readonly repo: MissionsRepository,
  ) {}

  async start(
    type: MissionType,
    ownerId: string,
  ): Promise<StartMissionResponseDto> {
    const brief = MISSION_BRIEFS[type];
    if (!brief) {
      throw new NotFoundException(`Unknown mission type: ${String(type)}`);
    }
    return this.launch(type, brief, ownerId);
  }

  async startExtraction(
    document: MissionDocument,
    ownerId: string,
  ): Promise<StartMissionResponseDto> {
    return this.launch('extraction', extractionBrief(document), ownerId);
  }

  private async launch(
    type: MissionType,
    brief: MissionBrief,
    ownerId: string,
  ): Promise<StartMissionResponseDto> {
    const run: MissionRun = {
      id: randomUUID(),
      ownerId,
      code: `007-${String(await this.repo.nextCodeNumber(ownerId)).padStart(3, '0')}`,
      events: new ReplaySubject<MissionEvent>(),
      seq: 0,
      persist: Promise.resolve(),
    };
    await this.repo.create({ id: run.id, ownerId, code: run.code, type });
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
        extracted: debrief?.extracted,
      });
    } catch (err) {
      this.logger.error(`Failed to finalize mission ${run.code}`, err);
    } finally {
      run.events.complete();
    }
  }

  /** Live SSE stream; finished missions are served by storedEvents instead.
   *  Ownership is checked here too, so a live run's id can't be replayed by
   *  another session. */
  eventStream(missionId: string, ownerId: string): Observable<MissionEvent> {
    const run = this.runs.get(missionId);
    if (!run || run.ownerId !== ownerId) {
      throw new NotFoundException(`Unknown mission: ${missionId}`);
    }
    return run.events.asObservable();
  }

  async history(ownerId: string): Promise<MissionSummaryDto[]> {
    const summaries = await this.repo.list(ownerId);
    return summaries.map((summary) => ({
      ...summary,
      title: MISSION_TITLES[summary.type] ?? summary.type,
    }));
  }

  async analytics(ownerId: string): Promise<MissionAnalyticsDto> {
    const { typeStatus, gadgets, flaggedInvoices } =
      await this.repo.analytics(ownerId);

    const perType = new Map<
      MissionType,
      MissionTypeStatsDto & { durationSumMs: number; finished: number }
    >();
    for (const row of typeStatus) {
      const type = row.type as MissionType;
      const stats = perType.get(type) ?? {
        type,
        title: MISSION_TITLES[type] ?? row.type,
        total: 0,
        completed: 0,
        failed: 0,
        running: 0,
        durationSumMs: 0,
        finished: 0,
      };
      stats.total += row.count;
      if (row.status === 'completed') stats.completed += row.count;
      else if (row.status === 'failed') stats.failed += row.count;
      else stats.running += row.count;
      if (row.avgMs !== null) {
        stats.durationSumMs += row.avgMs * row.count;
        stats.finished += row.count;
      }
      perType.set(type, stats);
    }

    const byType = [...perType.values()]
      .sort((a, b) => b.total - a.total || a.type.localeCompare(b.type))
      .map(({ durationSumMs, finished, ...stats }) => ({
        ...stats,
        ...(finished > 0
          ? { avgDurationMs: Math.round(durationSumMs / finished) }
          : {}),
      }));

    const totals = [...perType.values()].reduce(
      (acc, t) => ({
        completed: acc.completed + t.completed,
        failed: acc.failed + t.failed,
        running: acc.running + t.running,
        durationSumMs: acc.durationSumMs + t.durationSumMs,
        finished: acc.finished + t.finished,
      }),
      { completed: 0, failed: 0, running: 0, durationSumMs: 0, finished: 0 },
    );
    const decided = totals.completed + totals.failed;

    return {
      totalMissions: decided + totals.running,
      completed: totals.completed,
      failed: totals.failed,
      running: totals.running,
      ...(decided > 0 ? { successRate: totals.completed / decided } : {}),
      ...(totals.finished > 0
        ? { avgDurationMs: Math.round(totals.durationSumMs / totals.finished) }
        : {}),
      flaggedInvoices,
      byType,
      gadgets,
    };
  }

  async storedEvents(
    missionId: string,
    ownerId: string,
  ): Promise<MissionEvent[]> {
    if (!(await this.repo.exists(missionId, ownerId))) {
      throw new NotFoundException(`Unknown mission: ${missionId}`);
    }
    return this.repo.getEvents(missionId);
  }
}
