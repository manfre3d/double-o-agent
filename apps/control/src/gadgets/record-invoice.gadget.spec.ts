import { RecordInvoiceGadget } from './record-invoice.gadget';
import { MissionContext } from './gadget.interface';

const VALID = {
  number: 'FT-2026/0203',
  counterparty: 'Officine Meccaniche Franchi S.r.l.',
  amount: 1842.2,
  currency: 'eur',
  issueDate: '2026-06-18',
};

describe('RecordInvoiceGadget', () => {
  const gadget = new RecordInvoiceGadget();
  let ctx: MissionContext;

  beforeEach(() => {
    ctx = { missionId: 'm1', flagged: [] };
  });

  it('normalizes and records the invoice on the mission context', async () => {
    const outcome = await gadget.execute({ ...VALID }, ctx);
    expect(ctx.extracted).toEqual({ ...VALID, currency: 'EUR' });
    expect(outcome).toEqual({ ok: true, value: { recorded: ctx.extracted } });
  });

  it('rejects invalid fields and lists every problem', async () => {
    const outcome = await gadget.execute(
      { ...VALID, amount: -5, issueDate: '18/06/2026' },
      ctx,
    );
    expect(outcome).toEqual({
      ok: false,
      error:
        'Invalid invoice record: amount must be a positive number; ' +
        'issueDate must be YYYY-MM-DD.',
    });
    expect(ctx.extracted).toBeUndefined();
  });

  it('rejects missing fields without crashing', async () => {
    const outcome = await gadget.execute(
      {} as Parameters<typeof gadget.execute>[0],
      ctx,
    );
    expect(outcome.ok).toBe(false);
    expect(ctx.extracted).toBeUndefined();
  });
});
