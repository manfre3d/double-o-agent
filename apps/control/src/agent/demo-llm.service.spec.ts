import { DemoLlmService } from './demo-llm.service';
import { AgentLoopService, MissionEventDraft } from './agent-loop.service';
import { GadgetRegistry } from '../gadgets/gadget.registry';
import { InvoicesRepository } from '../gadgets/invoices.repository';
import { ListInvoicesGadget } from '../gadgets/list-invoices.gadget';
import { CompareInvoicesGadget } from '../gadgets/compare-invoices.gadget';
import { FlagInvoiceGadget } from '../gadgets/flag-invoice.gadget';
import { ReadDocumentGadget } from '../gadgets/read-document.gadget';
import { RecordInvoiceGadget } from '../gadgets/record-invoice.gadget';

function buildLoop() {
  const repo = new InvoicesRepository();
  const registry = new GadgetRegistry(
    new ListInvoicesGadget(repo),
    new CompareInvoicesGadget(repo),
    new FlagInvoiceGadget(repo),
    new ReadDocumentGadget(),
    new RecordInvoiceGadget(),
  );
  const demo = new DemoLlmService(0);
  return new AgentLoopService(demo, demo, registry, true);
}

describe('DemoLlmService', () => {
  it('drives a full duplicate hunt over the real gadgets to a debrief', async () => {
    const events: MissionEventDraft[] = [];
    await buildLoop().run(
      {
        missionId: 'demo',
        code: '007-000',
        title: 'Caccia ai doppioni',
        objective: 'Esercitazione.',
        task: 'Begin the duplicate hunt.',
        instructions: 'Your mission: hunt duplicate invoices.',
        gadgets: ['list_invoices', 'compare_invoices', 'flag_invoice'],
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

  it('drives an extraction mission to a debrief with a recorded invoice', async () => {
    const events: MissionEventDraft[] = [];
    await buildLoop().run(
      {
        missionId: 'demo',
        code: '007-000',
        title: 'Decifrazione del dossier',
        objective: 'Esercitazione.',
        task: 'Extract the invoice data from the attached document "fattura-di-prova.pdf".',
        instructions: 'Your mission: extract the invoice data.',
        gadgets: ['read_document', 'record_invoice'],
        document: { filename: 'fattura-di-prova.pdf', text: 'Fattura …' },
      },
      (draft) => events.push(draft),
    );

    const last = events.at(-1);
    expect(last?.type).toBe('debrief');
    if (last?.type === 'debrief') {
      expect(last.extracted).toEqual({
        number: 'FT-2026/0203',
        counterparty: 'Officine Meccaniche Franchi S.r.l.',
        amount: 1842.2,
        currency: 'EUR',
        issueDate: '2026-06-18',
      });
    }

    const failures = events.filter((e) => e.type === 'gadget_result' && !e.ok);
    expect(failures).toEqual([]);
  });
});
