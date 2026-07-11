import type { ExtractedInvoiceDto } from '@double-o/shared';
import { failedCase, scoreExtraction, scoreHunt } from './scoring';

const golden: ExtractedInvoiceDto = {
  number: 'FT-2026/0203',
  counterparty: 'Officine Meccaniche Franchi S.r.l.',
  amount: 1842.2,
  currency: 'EUR',
  issueDate: '2026-06-18',
};

describe('scoreExtraction', () => {
  it('passes an exact match', () => {
    const verdict = scoreExtraction('x', golden, { ...golden });
    expect(verdict.pass).toBe(true);
    expect(verdict.checks).toHaveLength(5);
  });

  it('tolerates formatting noise the missions tolerate', () => {
    const verdict = scoreExtraction('x', golden, {
      number: 'FT 2026 0203',
      counterparty: 'Officine Meccaniche Franchi Srl',
      amount: 1842.2,
      currency: 'eur',
      issueDate: '2026-06-18',
    });
    expect(verdict.pass).toBe(true);
  });

  it('fails field by field on real mismatches', () => {
    const verdict = scoreExtraction('x', golden, {
      ...golden,
      amount: 1510.0,
      issueDate: '2026-06-19',
    });
    expect(verdict.pass).toBe(false);
    const failing = verdict.checks.filter((c) => !c.ok).map((c) => c.label);
    expect(failing).toEqual(['amount', 'issueDate']);
    expect(verdict.checks.find((c) => c.label === 'amount')?.detail).toBe(
      'expected 1842.2, got 1510',
    );
  });

  it('fails when an expected invoice was never recorded', () => {
    const verdict = scoreExtraction('x', golden, undefined);
    expect(verdict.pass).toBe(false);
    expect(verdict.checks).toEqual([
      {
        label: 'records the invoice',
        ok: false,
        detail: 'nothing was recorded',
      },
    ]);
  });

  it('passes a non-invoice document that recorded nothing', () => {
    expect(scoreExtraction('x', null, undefined).pass).toBe(true);
  });

  it('fails a non-invoice document that recorded anyway', () => {
    const verdict = scoreExtraction('x', null, golden);
    expect(verdict.pass).toBe(false);
    expect(verdict.checks[0].label).toBe('records nothing');
  });
});

describe('scoreHunt', () => {
  const flag = (invoiceId: string) => ({ invoiceId, reason: 'Doppione.' });

  it('passes the exact flag set regardless of order', () => {
    const verdict = scoreHunt(
      'x',
      ['INV-004', 'INV-008'],
      [flag('INV-008'), flag('INV-004')],
    );
    expect(verdict.pass).toBe(true);
  });

  it('fails on a missed duplicate', () => {
    const verdict = scoreHunt('x', ['INV-004', 'INV-008'], [flag('INV-004')]);
    expect(verdict.pass).toBe(false);
    expect(verdict.checks.find((c) => !c.ok)?.label).toBe('flags INV-008');
  });

  it('fails on an extra flag and names it', () => {
    const verdict = scoreHunt('x', [], [flag('INV-101')]);
    expect(verdict.pass).toBe(false);
    expect(verdict.checks).toEqual([
      { label: 'no extra flags', ok: false, detail: 'also flagged INV-101' },
    ]);
  });

  it('passes a clean batch with no flags', () => {
    expect(scoreHunt('x', [], []).pass).toBe(true);
  });
});

describe('failedCase', () => {
  it('carries the failure reason into the verdict', () => {
    const verdict = failedCase('x', 'extraction', 'Missione fallita: boom');
    expect(verdict.pass).toBe(false);
    expect(verdict.checks[0].detail).toBe('Missione fallita: boom');
  });
});
