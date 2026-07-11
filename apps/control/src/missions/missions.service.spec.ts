import { NotFoundException } from '@nestjs/common';
import { firstValueFrom, toArray } from 'rxjs';
import { MissionsService } from './missions.service';
import { MissionsRepository } from './missions.repository';
import {
  AgentLoopService,
  EmitFn,
  MissionRunSpec,
} from '../agent/agent-loop.service';

const SAMPLE_EXTRACTED = {
  number: 'FT-2026/0203',
  counterparty: 'Officine Meccaniche Franchi S.r.l.',
  amount: 1842.2,
  currency: 'EUR',
  issueDate: '2026-06-18',
};

function build() {
  const fakeLoop = {
    run: (spec: MissionRunSpec, emit: EmitFn) => {
      emit({
        type: 'briefing',
        code: spec.code,
        title: spec.title,
        objective: spec.objective,
      });
      emit({
        type: 'debrief',
        text: 'Fine.',
        flagged: [],
        ...(spec.document ? { extracted: SAMPLE_EXTRACTED } : {}),
      });
      return Promise.resolve();
    },
  } as AgentLoopService;

  const repo = {
    create: jest.fn().mockResolvedValue(undefined),
    nextCodeNumber: jest.fn().mockResolvedValue(1),
    appendEvent: jest.fn().mockResolvedValue(undefined),
    finish: jest.fn().mockResolvedValue(undefined),
    list: jest.fn().mockResolvedValue([]),
    exists: jest.fn().mockResolvedValue(false),
    getEvents: jest.fn().mockResolvedValue([]),
  };

  return {
    service: new MissionsService(
      fakeLoop,
      repo as unknown as MissionsRepository,
    ),
    repo,
  };
}

describe('MissionsService', () => {
  it('starts a mission and replays its full event stream', async () => {
    const { service } = build();
    const { missionId, code } = await service.start('duplicate-hunt');
    expect(code).toBe('007-001');

    const events = await firstValueFrom(
      service.eventStream(missionId).pipe(toArray()),
    );
    expect(events.map((e) => e.type)).toEqual(['briefing', 'debrief']);
    expect(events.map((e) => e.seq)).toEqual([0, 1]);
    expect(events.every((e) => e.missionId === missionId)).toBe(true);
  });

  it('persists the mission, every event, and the final outcome', async () => {
    const { service, repo } = build();
    const { missionId, code } = await service.start('duplicate-hunt');

    expect(repo.create).toHaveBeenCalledWith({
      id: missionId,
      code,
      type: 'duplicate-hunt',
    });

    await firstValueFrom(service.eventStream(missionId).pipe(toArray()));
    expect(repo.appendEvent).toHaveBeenCalledTimes(2);
    expect(repo.finish).toHaveBeenCalledWith(missionId, {
      status: 'completed',
      debrief: 'Fine.',
      flagged: [],
    });
  });

  it('starts an extraction mission and persists the recorded invoice', async () => {
    const { service, repo } = build();
    const { missionId } = await service.startExtraction({
      filename: 'fattura.pdf',
      text: 'Fattura n. FT-2026/0203 …',
    });

    expect(repo.create).toHaveBeenCalledWith({
      id: missionId,
      code: '007-001',
      type: 'extraction',
    });

    const events = await firstValueFrom(
      service.eventStream(missionId).pipe(toArray()),
    );
    expect(events.map((e) => e.type)).toEqual(['briefing', 'debrief']);
    expect(repo.finish).toHaveBeenCalledWith(missionId, {
      status: 'completed',
      debrief: 'Fine.',
      flagged: [],
      extracted: SAMPLE_EXTRACTED,
    });
  });

  it('enriches history summaries with the mission title', async () => {
    const { service, repo } = build();
    repo.list.mockResolvedValue([
      {
        missionId: 'm1',
        code: '007-001',
        type: 'duplicate-hunt',
        status: 'completed',
      },
    ]);
    const history = await service.history();
    expect(history[0].title).toBe('Caccia ai doppioni');
  });

  it('throws NotFound for unknown live streams and stored events', async () => {
    const { service } = build();
    expect(() => service.eventStream('nope')).toThrow(NotFoundException);
    await expect(service.storedEvents('nope')).rejects.toThrow(
      NotFoundException,
    );
  });
});
