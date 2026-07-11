import { CompareInvoicesGadget } from './compare-invoices.gadget';
import { InvoicesRepository } from './invoices.repository';
import { MissionContext } from './gadget.interface';

describe('CompareInvoicesGadget', () => {
  const gadget = new CompareInvoicesGadget(new InvoicesRepository());
  const ctx: MissionContext = { missionId: 'm1', flagged: [] };

  it('matches the exact duplicate pair on every field', async () => {
    const outcome = await gadget.execute(
      { invoiceIdA: 'INV-002', invoiceIdB: 'INV-004' },
      ctx,
    );
    expect(outcome).toMatchObject({
      ok: true,
      value: {
        matches: {
          number: true,
          counterparty: true,
          amount: true,
          issueDate: true,
        },
      },
    });
  });

  it('normalizes formatting differences in invoice numbers', async () => {
    const outcome = await gadget.execute(
      { invoiceIdA: 'INV-006', invoiceIdB: 'INV-008' },
      ctx,
    );
    expect(outcome).toMatchObject({
      ok: true,
      value: {
        matches: {
          number: true,
          counterparty: true,
          amount: true,
          issueDate: false,
        },
      },
    });
  });

  it('returns a typed error for unknown ids', async () => {
    const outcome = await gadget.execute(
      { invoiceIdA: 'INV-001', invoiceIdB: 'NOPE' },
      ctx,
    );
    expect(outcome).toEqual({
      ok: false,
      error: 'Unknown invoice id(s): NOPE',
    });
  });
});
