import { InvoicesRepository } from '../gadgets/invoices.repository';
import { GOLDEN_CASES } from './golden';

describe('golden set', () => {
  it('has unique case names', () => {
    const names = GOLDEN_CASES.map((c) => c.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('expects only invoice ids that exist in the case batch', () => {
    const seededIds = new InvoicesRepository().findAll().map((i) => i.id);
    for (const kase of GOLDEN_CASES) {
      if (kase.kind !== 'duplicate-hunt') {
        continue;
      }
      const ids = kase.batch ? kase.batch.map((i) => i.id) : seededIds;
      for (const expected of kase.expectedFlagged) {
        expect(ids).toContain(expected);
      }
    }
  });

  it('keeps a demo-replayable case per mission kind, so CI scores without a key', () => {
    for (const kind of ['extraction', 'duplicate-hunt'] as const) {
      expect(GOLDEN_CASES.some((c) => c.kind === kind && c.demo)).toBe(true);
    }
  });
});
