import { FlagInvoiceGadget } from './flag-invoice.gadget';
import { InvoicesRepository } from './invoices.repository';
import { MissionContext } from './gadget.interface';

describe('FlagInvoiceGadget', () => {
  const gadget = new FlagInvoiceGadget(new InvoicesRepository());
  let ctx: MissionContext;

  beforeEach(() => {
    ctx = { missionId: 'm1', flagged: [] };
  });

  it('records the flag on the mission context', async () => {
    const outcome = await gadget.execute(
      { invoiceId: 'INV-004', reason: 'Registrata due volte.' },
      ctx,
    );
    expect(outcome).toEqual({ ok: true, value: { flagged: 'INV-004' } });
    expect(ctx.flagged).toEqual([
      { invoiceId: 'INV-004', reason: 'Registrata due volte.' },
    ]);
  });

  it('rejects flagging the same invoice twice', async () => {
    await gadget.execute({ invoiceId: 'INV-004', reason: 'x' }, ctx);
    const outcome = await gadget.execute(
      { invoiceId: 'INV-004', reason: 'y' },
      ctx,
    );
    expect(outcome).toEqual({
      ok: false,
      error: 'Invoice INV-004 is already flagged.',
    });
    expect(ctx.flagged).toHaveLength(1);
  });

  it('rejects unknown invoice ids', async () => {
    const outcome = await gadget.execute(
      { invoiceId: 'NOPE', reason: 'x' },
      ctx,
    );
    expect(outcome).toEqual({ ok: false, error: 'Unknown invoice id: NOPE' });
    expect(ctx.flagged).toHaveLength(0);
  });
});
