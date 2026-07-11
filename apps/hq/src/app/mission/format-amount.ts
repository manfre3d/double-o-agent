import type { ExtractedInvoiceDto } from '@double-o/shared';

const AMOUNT_FORMAT = new Intl.NumberFormat('it-IT', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** '1.842,20 EUR' — Italian-style formatting for lore-facing amounts. */
export function formatInvoiceAmount(invoice: ExtractedInvoiceDto): string {
  return `${AMOUNT_FORMAT.format(invoice.amount)} ${invoice.currency}`;
}
