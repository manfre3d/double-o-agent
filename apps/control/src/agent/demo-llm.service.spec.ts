import { DemoLlmService } from './demo-llm.service';
import { AgentLoopService, MissionEventDraft } from './agent-loop.service';
import { GadgetRegistry } from '../gadgets/gadget.registry';
import { InvoicesRepository } from '../gadgets/invoices.repository';
import { ListInvoicesGadget } from '../gadgets/list-invoices.gadget';
import { CompareInvoicesGadget } from '../gadgets/compare-invoices.gadget';
import { FlagInvoiceGadget } from '../gadgets/flag-invoice.gadget';

describe('DemoLlmService', () => {
  it('drives a full mission over the real gadgets to a completed debrief', async () => {
    const repo = new InvoicesRepository();
    const registry = new GadgetRegistry(
      new ListInvoicesGadget(repo),
      new CompareInvoicesGadget(repo),
      new FlagInvoiceGadget(repo),
    );
    const loop = new AgentLoopService(new DemoLlmService(0), registry);

    const events: MissionEventDraft[] = [];
    await loop.run(
      {
        missionId: 'demo',
        code: '007-000',
        title: 'Caccia ai doppioni',
        objective: 'Esercitazione.',
        task: 'Begin the duplicate hunt.',
      },
      (draft) => events.push(draft),
    );

    expect(events[0].type).toBe('briefing');
    const last = events.at(-1);
    expect(last?.type).toBe('debrief');
    if (last?.type === 'debrief') {
      expect(last.flagged.map((f) => f.invoiceId)).toEqual([
        'INV-004',
        'INV-008',
      ]);
    }

    const failures = events.filter((e) => e.type === 'gadget_result' && !e.ok);
    expect(failures).toEqual([]);
  });
});
