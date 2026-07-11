import { NotFoundException } from '@nestjs/common';
import { firstValueFrom, toArray } from 'rxjs';
import { MissionsService } from './missions.service';
import {
  AgentLoopService,
  EmitFn,
  MissionRunSpec,
} from '../agent/agent-loop.service';

function buildService() {
  const fakeLoop = {
    run: (spec: MissionRunSpec, emit: EmitFn) => {
      emit({
        type: 'briefing',
        code: spec.code,
        title: spec.title,
        objective: spec.objective,
      });
      emit({ type: 'debrief', text: 'Fine.', flagged: [] });
      return Promise.resolve();
    },
  } as AgentLoopService;
  return new MissionsService(fakeLoop);
}

describe('MissionsService', () => {
  it('starts a mission and replays its full event stream', async () => {
    const service = buildService();
    const { missionId, code } = service.start('duplicate-hunt');
    expect(code).toBe('007-001');

    const events = await firstValueFrom(
      service.eventStream(missionId).pipe(toArray()),
    );
    expect(events.map((e) => e.type)).toEqual(['briefing', 'debrief']);
    expect(events.map((e) => e.seq)).toEqual([0, 1]);
    expect(events.every((e) => e.missionId === missionId)).toBe(true);
  });

  it('throws NotFound for an unknown mission stream', () => {
    const service = buildService();
    expect(() => service.eventStream('nope')).toThrow(NotFoundException);
  });
});
