export interface InvoiceDto {
  id: string;
  /** Supplier's invoice number, e.g. 'FT-2026/0114'. */
  number: string;
  counterparty: string;
  amount: number;
  currency: 'EUR';
  /** ISO-8601 date. */
  issueDate: string;
}

export interface FlaggedInvoiceDto {
  invoiceId: string;
  /** Shown to users in the debrief — Italian, per the lore language rule. */
  reason: string;
}

/** Structured fields the agent extracts from an uploaded invoice document. */
export interface ExtractedInvoiceDto {
  /** Supplier's invoice number, e.g. 'FT-2026/0203'. */
  number: string;
  counterparty: string;
  amount: number;
  /** ISO-4217 code, e.g. 'EUR'. */
  currency: string;
  /** ISO-8601 date. */
  issueDate: string;
}
