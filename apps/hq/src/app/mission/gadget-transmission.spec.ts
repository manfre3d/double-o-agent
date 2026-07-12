import { TestBed } from '@angular/core/testing';
import type { GadgetCallEvent, GadgetResultEvent, InvoiceDto } from '@double-o/shared';
import { GadgetTransmission } from './gadget-transmission';

const INVOICE: InvoiceDto = {
  id: 'inv-001',
  number: 'FT-2026/0114',
  counterparty: 'Rossi S.r.l.',
  amount: 1842.2,
  currency: 'EUR',
  issueDate: '2026-03-14',
};

function callEvent(overrides: Partial<GadgetCallEvent> = {}): GadgetCallEvent {
  return {
    type: 'gadget_call',
    missionId: 'm-1',
    seq: 1,
    at: new Date().toISOString(),
    gadget: 'list_invoices',
    params: {},
    ...overrides,
  };
}

function resultEvent(overrides: Partial<GadgetResultEvent> = {}): GadgetResultEvent {
  return {
    type: 'gadget_result',
    missionId: 'm-1',
    seq: 2,
    at: new Date().toISOString(),
    gadget: 'list_invoices',
    ok: true,
    ...overrides,
  };
}

function render(event: GadgetCallEvent | GadgetResultEvent): HTMLElement {
  const fixture = TestBed.createComponent(GadgetTransmission);
  fixture.componentRef.setInput('event', event);
  fixture.detectChanges();
  TestBed.tick();
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('GadgetTransmission', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GadgetTransmission],
    }).compileComponents();
  });

  it('renders a call as a gadget label plus typed params', () => {
    const el = render(
      callEvent({
        gadget: 'compare_invoices',
        params: { invoiceIdA: 'inv-001', invoiceIdB: 'inv-007' },
      }),
    );
    expect(el.querySelector('.transmission-gadget')?.textContent).toContain(
      'compare_invoices',
    );
    expect(el.textContent).toContain('invoiceIdA');
    expect(el.textContent).toContain('inv-007');
    expect(el.querySelector('details')).toBeNull();
  });

  it('renders an invoice list as a ledger, not raw JSON', () => {
    const el = render(
      resultEvent({ result: [INVOICE, { ...INVOICE, id: 'inv-002', number: 'FT-2026/0115' }] }),
    );
    expect(el.querySelectorAll('.transmission-ledger tbody tr').length).toBe(2);
    expect(el.textContent).toContain('1842,20 EUR');
    expect(el.querySelector('details')).toBeNull();
  });

  it('caps the ledger and notes the remainder', () => {
    const rows = Array.from({ length: 10 }, (_, i) => ({ ...INVOICE, id: `inv-${i}` }));
    const el = render(resultEvent({ result: rows }));
    expect(el.querySelectorAll('.transmission-ledger tbody tr').length).toBe(8);
    expect(el.textContent).toContain('e altre 2 voci');
  });

  it('renders a comparison with per-field match marks', () => {
    const el = render(
      resultEvent({
        gadget: 'compare_invoices',
        result: {
          a: INVOICE,
          b: { ...INVOICE, id: 'inv-007', issueDate: '2026-03-20' },
          matches: { number: true, counterparty: true, amount: true, issueDate: false },
        },
      }),
    );
    expect(el.querySelectorAll('.transmission-mark').length).toBe(4);
    expect(el.querySelector('.transmission-mark--fail')?.textContent).toContain('Data');
  });

  it('renders a recorded invoice as a typed record', () => {
    const el = render(
      resultEvent({
        gadget: 'record_invoice',
        result: {
          recorded: {
            number: 'FT-2026/0203',
            counterparty: 'ACME S.p.A.',
            amount: 10,
            currency: 'EUR',
            issueDate: '2026-01-01',
          },
        },
      }),
    );
    expect(el.querySelector('.transmission-record')).not.toBeNull();
    expect(el.textContent).toContain('Fattura n.');
    expect(el.textContent).toContain('ACME S.p.A.');
  });

  it('renders small flat payloads as key/value rows', () => {
    const el = render(resultEvent({ gadget: 'flag_invoice', result: { flagged: 'inv-003' } }));
    expect(el.querySelector('.transmission-record')?.textContent).toContain('inv-003');
    expect(el.querySelector('details')).toBeNull();
  });

  it('collapses unknown payloads behind Dati grezzi', () => {
    const el = render(resultEvent({ result: { nested: { deep: [1, 2, 3] } } }));
    const details = el.querySelector('details.transmission-raw');
    expect(details).not.toBeNull();
    expect(details?.hasAttribute('open')).toBe(false);
    expect(details?.textContent).toContain('Dati grezzi');
  });

  it('renders a failed result in the error frame', () => {
    const el = render(
      resultEvent({ ok: false, result: undefined, error: 'Unknown invoice id(s): inv-999' }),
    );
    expect(el.querySelector('.transmission-error')?.textContent).toContain(
      'Unknown invoice id(s): inv-999',
    );
    expect(el.querySelector('.transmission-ledger')).toBeNull();
  });
});
