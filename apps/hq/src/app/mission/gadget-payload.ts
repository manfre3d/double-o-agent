import type { ExtractedInvoiceDto } from '@double-o/shared';

/** Common shape of a stored or extracted invoice as gadgets return them. */
export type InvoiceRecord = ExtractedInvoiceDto;

export interface InvoiceComparison {
  a: InvoiceRecord;
  b: InvoiceRecord;
  matches: Record<string, boolean>;
}

// Structural guards, not gadget-name keyed: any future gadget returning one
// of these shapes gets the rich feed rendering for free.

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isInvoiceRecord(value: unknown): value is InvoiceRecord {
  return (
    isRecord(value) &&
    typeof value['number'] === 'string' &&
    typeof value['counterparty'] === 'string' &&
    typeof value['amount'] === 'number' &&
    typeof value['currency'] === 'string' &&
    typeof value['issueDate'] === 'string'
  );
}

export function invoiceList(value: unknown): InvoiceRecord[] | undefined {
  return Array.isArray(value) && value.length > 0 && value.every(isInvoiceRecord)
    ? value
    : undefined;
}

export function invoiceComparison(value: unknown): InvoiceComparison | undefined {
  if (
    isRecord(value) &&
    isInvoiceRecord(value['a']) &&
    isInvoiceRecord(value['b']) &&
    isRecord(value['matches']) &&
    Object.values(value['matches']).every((m) => typeof m === 'boolean')
  ) {
    return {
      a: value['a'],
      b: value['b'],
      matches: value['matches'] as Record<string, boolean>,
    };
  }
  return undefined;
}

export function recordedInvoice(value: unknown): InvoiceRecord | undefined {
  return isRecord(value) && isInvoiceRecord(value['recorded'])
    ? value['recorded']
    : undefined;
}

export function textPayload(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

/** Small flat objects render as key/value rows instead of raw JSON. */
export function flatEntries(
  value: unknown,
): { key: string; value: string }[] | undefined {
  if (!isRecord(value)) {
    return undefined;
  }
  const entries = Object.entries(value);
  const flat =
    entries.length > 0 &&
    entries.length <= 6 &&
    entries.every(([, v]) => ['string', 'number', 'boolean'].includes(typeof v));
  return flat ? entries.map(([key, v]) => ({ key, value: String(v) })) : undefined;
}
