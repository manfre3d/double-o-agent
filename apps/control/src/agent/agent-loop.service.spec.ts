import {
  AgentLoopService,
  MissionEventDraft,
  MissionRunSpec,
} from './agent-loop.service';
import { LlmService } from './llm.service';
import { DemoLlmService } from './demo-llm.service';
import { AssistantTurn } from './agent.types';
import { GadgetRegistry } from '../gadgets/gadget.registry';
import { SEED_INVOICES } from '../gadgets/invoices.repository';
import { ListInvoicesGadget } from '../gadgets/list-invoices.gadget';
import { CompareInvoicesGadget } from '../gadgets/compare-invoices.gadget';
import { FlagInvoiceGadget } from '../gadgets/flag-invoice.gadget';
import { ReadDocumentGadget } from '../gadgets/read-document.gadget';
import { RecordInvoiceGadget } from '../gadgets/record-invoice.gadget';

const spec: MissionRunSpec = {
  missionId: 'm1',
  code: '007-001',
  title: 'Caccia ai doppioni',
  objective: 'Trovare i doppioni.',
  task: 'Begin the duplicate hunt.',
  instructions: 'Your mission: hunt duplicate invoices.',
  gadgets: ['list_invoices', 'compare_invoices', 'flag_invoice'],
  invoices: SEED_INVOICES,
};

function makeChat(turns: AssistantTurn[] | Error) {
  const chat = jest.fn<Promise<AssistantTurn>, unknown[]>();
  if (turns instanceof Error) {
    chat.mockRejectedValue(turns);
  } else {
    turns.forEach((turn) => chat.mockResolvedValueOnce(Promise.resolve(turn)));
  }
  return chat;
}

function buildLoop(
  turns: AssistantTurn[] | Error,
  opts: { demoTurns?: AssistantTurn[]; liveAvailable?: boolean } = {},
) {
  const registry = new GadgetRegistry(
    new ListInvoicesGadget(),
    new CompareInvoicesGadget(),
    new FlagInvoiceGadget(),
    new ReadDocumentGadget(),
    new RecordInvoiceGadget(),
  );
  const chat = makeChat(turns);
  const demoChat = makeChat(
    opts.demoTurns ?? [{ text: 'Demo.', toolCalls: [] }],
  );
  const llm = { chat } as unknown as LlmService;
  const demo = { chat: demoChat } as unknown as DemoLlmService;
  const loop = new AgentLoopService(
    llm,
    demo,
    registry,
    opts.liveAvailable ?? true,
  );
  return { loop, chat, demoChat };
}

async function runCollecting(
  loop: AgentLoopService,
  runSpec: MissionRunSpec = spec,
  opts?: { demo?: boolean },
): Promise<MissionEventDraft[]> {
  const events: MissionEventDraft[] = [];
  await loop.run(runSpec, (draft) => events.push(draft), opts);
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

  it("exposes exactly the mission's gadget set to the LLM", async () => {
    const { loop, chat } = buildLoop([{ text: 'Fine.', toolCalls: [] }]);
    await runCollecting(loop);

    const tools = chat.mock.calls[0][1] as { name: string }[];
    expect(tools.map((t) => t.name)).toEqual([
      'list_invoices',
      'compare_invoices',
      'flag_invoice',
    ]);
  });

  it('runs an extraction mission: document in, recorded invoice out', async () => {
    const extractionSpec: MissionRunSpec = {
      ...spec,
      title: 'Decifrazione del dossier',
      objective: 'Estrarre i dati della fattura.',
      task: 'Extract the invoice data from the attached document "fattura.pdf".',
      instructions: 'Your mission: extract the invoice data.',
      gadgets: ['read_document', 'record_invoice'],
      document: { filename: 'fattura.pdf', text: 'Fattura n. FT-1 …' },
    };
    const recorded = {
      number: 'FT-1',
      counterparty: 'Rossi S.r.l.',
      amount: 100,
      currency: 'EUR',
      issueDate: '2026-06-18',
    };
    const { loop, chat } = buildLoop([
      {
        text: 'Apro il dossier.',
        toolCalls: [{ id: 'c1', name: 'read_document', args: {} }],
      },
      {
        toolCalls: [{ id: 'c2', name: 'record_invoice', args: recorded }],
      },
      { text: 'Rapporto finale.', toolCalls: [] },
    ]);

    const events: MissionEventDraft[] = [];
    await loop.run(extractionSpec, (draft) => events.push(draft));

    const tools = chat.mock.calls[0][1] as { name: string }[];
    expect(tools.map((t) => t.name)).toEqual([
      'read_document',
      'record_invoice',
    ]);
    const readResult = events.find((e) => e.type === 'gadget_result');
    expect(readResult).toMatchObject({
      ok: true,
      result: extractionSpec.document,
    });
    expect(events.at(-1)).toEqual({
      type: 'debrief',
      text: 'Rapporto finale.',
      flagged: [],
      extracted: recorded,
    });
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

  it('routes to the demo brain when the run requests demo mode', async () => {
    const { loop, chat, demoChat } = buildLoop(
      [{ text: 'Live.', toolCalls: [] }],
      { demoTurns: [{ text: 'Demo.', toolCalls: [] }] },
    );
    const events = await runCollecting(loop, spec, { demo: true });
    expect(demoChat).toHaveBeenCalledTimes(1);
    expect(chat).not.toHaveBeenCalled();
    expect(events.at(-1)).toMatchObject({ type: 'debrief', text: 'Demo.' });
  });

  it('forces the demo brain when no live brain is configured', async () => {
    const { loop, chat, demoChat } = buildLoop(
      [{ text: 'Live.', toolCalls: [] }],
      { demoTurns: [{ text: 'Demo.', toolCalls: [] }], liveAvailable: false },
    );
    const events = await runCollecting(loop); // no demo flag — still forced to demo
    expect(demoChat).toHaveBeenCalledTimes(1);
    expect(chat).not.toHaveBeenCalled();
    expect(events.at(-1)).toMatchObject({ type: 'debrief', text: 'Demo.' });
  });
});
