import {
  AgentLoopService,
  MissionEventDraft,
  MissionRunSpec,
} from './agent-loop.service';
import { LlmService } from './llm.service';
import { AssistantTurn } from './agent.types';
import { GadgetRegistry } from '../gadgets/gadget.registry';
import { InvoicesRepository } from '../gadgets/invoices.repository';
import { ListInvoicesGadget } from '../gadgets/list-invoices.gadget';
import { CompareInvoicesGadget } from '../gadgets/compare-invoices.gadget';
import { FlagInvoiceGadget } from '../gadgets/flag-invoice.gadget';

const spec: MissionRunSpec = {
  missionId: 'm1',
  code: '007-001',
  title: 'Caccia ai doppioni',
  objective: 'Trovare i doppioni.',
  task: 'Begin the duplicate hunt.',
};

function buildLoop(turns: AssistantTurn[] | Error) {
  const repo = new InvoicesRepository();
  const registry = new GadgetRegistry(
    new ListInvoicesGadget(repo),
    new CompareInvoicesGadget(repo),
    new FlagInvoiceGadget(repo),
  );
  const chat = jest.fn<Promise<AssistantTurn>, unknown[]>();
  if (turns instanceof Error) {
    chat.mockRejectedValue(turns);
  } else {
    turns.forEach((turn) => chat.mockResolvedValueOnce(Promise.resolve(turn)));
  }
  const llm = { chat } as unknown as LlmService;
  return { loop: new AgentLoopService(llm, registry), chat };
}

async function runCollecting(
  loop: AgentLoopService,
): Promise<MissionEventDraft[]> {
  const events: MissionEventDraft[] = [];
  await loop.run(spec, (draft) => events.push(draft));
  return events;
}

describe('AgentLoopService', () => {
  it('streams briefing → thinking → gadget_call → gadget_result → debrief', async () => {
    const { loop } = buildLoop([
      {
        text: 'Esamino il lotto.',
        toolCalls: [{ id: 'c1', name: 'list_invoices', args: {} }],
      },
      {
        text: 'Segnalo il doppione.',
        toolCalls: [
          {
            id: 'c2',
            name: 'flag_invoice',
            args: { invoiceId: 'INV-004', reason: 'Doppione.' },
          },
        ],
      },
      { text: 'Rapporto finale.', toolCalls: [] },
    ]);

    const events = await runCollecting(loop);

    expect(events.map((e) => e.type)).toEqual([
      'briefing',
      'thinking',
      'gadget_call',
      'gadget_result',
      'thinking',
      'gadget_call',
      'gadget_result',
      'debrief',
    ]);
    expect(events.at(-1)).toEqual({
      type: 'debrief',
      text: 'Rapporto finale.',
      flagged: [{ invoiceId: 'INV-004', reason: 'Doppione.' }],
    });
  });

  it('exposes every registered gadget to the LLM', async () => {
    const { loop, chat } = buildLoop([{ text: 'Fine.', toolCalls: [] }]);
    await runCollecting(loop);

    const tools = chat.mock.calls[0][1] as { name: string }[];
    expect(tools.map((t) => t.name)).toEqual([
      'list_invoices',
      'compare_invoices',
      'flag_invoice',
    ]);
  });

  it('feeds gadget failures back to the LLM instead of crashing', async () => {
    const { loop } = buildLoop([
      {
        toolCalls: [
          {
            id: 'c1',
            name: 'flag_invoice',
            args: { invoiceId: 'NOPE', reason: 'x' },
          },
        ],
      },
      { text: 'Fine.', toolCalls: [] },
    ]);

    const events = await runCollecting(loop);
    const result = events.find((e) => e.type === 'gadget_result');
    expect(result).toMatchObject({
      ok: false,
      error: 'Unknown invoice id: NOPE',
    });
    expect(events.at(-1)?.type).toBe('debrief');
  });

  it('emits an error event when the LLM call fails', async () => {
    const { loop } = buildLoop(new Error('boom'));
    const events = await runCollecting(loop);
    expect(events.map((e) => e.type)).toEqual(['briefing', 'error']);
    expect(events.at(-1)).toEqual({
      type: 'error',
      message: 'Missione fallita: boom',
    });
  });
});
