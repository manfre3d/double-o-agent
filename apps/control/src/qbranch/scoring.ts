import type { ExtractedInvoiceDto, FlaggedInvoiceDto } from '@double-o/shared';

/**
 * Pure scoring of a mission outcome against a golden expectation.
 * Tolerant where the mission rules are tolerant (number formatting, legal
 * suffixes, currency case), strict everywhere else.
 */

export interface Check {
  label: string;
  ok: boolean;
  /** Mismatch detail, present only when the check failed. */
  detail?: string;
}

export interface CaseVerdict {
  name: string;
  kind: 'extraction' | 'duplicate-hunt';
  pass: boolean;
  checks: Check[];
}

export function scoreExtraction(
  name: string,
  expected: ExtractedInvoiceDto | null,
  actual: ExtractedInvoiceDto | undefined,
): CaseVerdict {
  const checks: Check[] = [];
  if (expected === null) {
    checks.push(
      check(
        'records nothing',
        actual === undefined,
        `recorded ${JSON.stringify(actual)} from a non-invoice document`,
      ),
    );
  } else if (actual === undefined) {
    checks.push(check('records the invoice', false, 'nothing was recorded'));
  } else {
    checks.push(
      field(
        'number',
        expected.number,
        actual.number,
        normalizeNumber(expected.number) === normalizeNumber(actual.number),
      ),
      field(
        'counterparty',
        expected.counterparty,
        actual.counterparty,
        counterpartyMatches(expected.counterparty, actual.counterparty),
      ),
      field(
        'amount',
        expected.amount,
        actual.amount,
        Math.abs(expected.amount - actual.amount) < 0.005,
      ),
      field(
        'currency',
        expected.currency,
        actual.currency,
        expected.currency.toUpperCase() === actual.currency.toUpperCase(),
      ),
      field(
        'issueDate',
        expected.issueDate,
        actual.issueDate,
        expected.issueDate === actual.issueDate,
      ),
    );
  }
  return verdict(name, 'extraction', checks);
}

export function scoreHunt(
  name: string,
  expectedFlagged: string[],
  flagged: FlaggedInvoiceDto[],
): CaseVerdict {
  const flaggedIds = flagged.map((f) => f.invoiceId);
  const checks: Check[] = expectedFlagged.map((id) =>
    check(`flags ${id}`, flaggedIds.includes(id), 'not flagged'),
  );
  const extras = flaggedIds.filter((id) => !expectedFlagged.includes(id));
  checks.push(
    check(
      'no extra flags',
      extras.length === 0,
      `also flagged ${extras.join(', ')}`,
    ),
  );
  return verdict(name, 'duplicate-hunt', checks);
}

/** Verdict for a mission that never reached a debrief (error event, turn limit). */
export function failedCase(
  name: string,
  kind: CaseVerdict['kind'],
  detail: string,
): CaseVerdict {
  return verdict(name, kind, [check('mission completes', false, detail)]);
}

function verdict(
  name: string,
  kind: CaseVerdict['kind'],
  checks: Check[],
): CaseVerdict {
  return { name, kind, pass: checks.every((c) => c.ok), checks };
}

function check(label: string, ok: boolean, failDetail: string): Check {
  return ok ? { label, ok } : { label, ok, detail: failDetail };
}

function field(
  label: string,
  expected: string | number,
  actual: string | number,
  ok: boolean,
): Check {
  return check(
    label,
    ok,
    `expected ${String(expected)}, got ${String(actual)}`,
  );
}

/** Same tolerance as the compare_invoices gadget: separators and case aside. */
function normalizeNumber(value: string): string {
  return value.replace(/[\s\-./]/g, '').toUpperCase();
}

/**
 * Case/punctuation-insensitive; containment tolerates a dropped or expanded
 * legal suffix ('Franchi S.r.l.' vs 'Franchi Srl' vs 'Franchi').
 */
function counterpartyMatches(expected: string, actual: string): boolean {
  const e = flattenName(expected);
  const a = flattenName(actual);
  return e.length > 0 && a.length > 0 && (e.includes(a) || a.includes(e));
}

function flattenName(value: string): string {
  return value.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
}
