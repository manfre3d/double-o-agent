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
  MissionRunSpec,
} from '../agent/agent-loop.service';
import { MissionDocument } from '../gadgets/gadget.interface';
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

type MissionBrief = Omit<MissionRunSpec, 'missionId' | 'code'>;

const MISSION_TITLES: Record<MissionType, string> = {
  'duplicate-hunt': 'Caccia ai doppioni',
  extraction: 'Decifrazione del dossier',
};

/** Missions startable without an attached document. */
const MISSION_BRIEFS: Partial<Record<MissionType, MissionBrief>> = {
  'duplicate-hunt': {
    title: MISSION_TITLES['duplicate-hunt'],
    objective:
      'Individuare e segnalare le fatture registrate due volte nel lotto corrente.',
    task: 'Begin the duplicate hunt on the current invoice batch.',
    instructions: `Your mission: hunt duplicate invoices in the current batch.
- A duplicate is the same supplier invoice entered more than once; formatting differences in the invoice number or a one-day date slip do not make two entries distinct.
- Verify each suspicion with a comparison before flagging, and flag the redundant copy, not the original.
- Name invoices inline by their id.
- In the debrief, summarize what was scanned, what was flagged and why.`,
    gadgets: ['list_invoices', 'compare_invoices', 'flag_invoice'],
  },
};

const EXTRACTION_INSTRUCTIONS = `Your mission: extract the invoice data from the attached document.
- Read the document, locate the supplier invoice fields, and record them with record_invoice using the exact values printed in the text.
- The counterparty is the supplier who issued the invoice (its name usually heads the document); it is never the customer marked as the recipient ("cliente", "spett.le", "destinatario").
- Convert amounts to plain decimal numbers; if several amounts appear, record the total due.
- If the document is not an invoice, record nothing and say so in the debrief.
- In the debrief, state the recorded fields and anything unusual about the document.`;

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
    return this.launch(type, brief);
  }

  async startExtraction(
    document: MissionDocument,
  ): Promise<StartMissionResponseDto> {
    return this.launch('extraction', {
      title: MISSION_TITLES.extraction,
      objective: `Decifrare il dossier «${document.filename}» ed estrarre i dati della fattura.`,
      task: `Extract the invoice data from the attached document "${document.filename}".`,
      instructions: EXTRACTION_INSTRUCTIONS,
      gadgets: ['read_document', 'record_invoice'],
      document,
    });
  }

  private async launch(
    type: MissionType,
    brief: MissionBrief,
  ): Promise<StartMissionResponseDto> {
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
        extracted: debrief?.extracted,
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
      title: MISSION_TITLES[summary.type] ?? summary.type,
    }));
  }

  async storedEvents(missionId: string): Promise<MissionEvent[]> {
    if (!(await this.repo.exists(missionId))) {
      throw new NotFoundException(`Unknown mission: ${missionId}`);
    }
    return this.repo.getEvents(missionId);
  }
}
