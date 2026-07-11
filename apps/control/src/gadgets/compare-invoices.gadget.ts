import { Injectable } from '@nestjs/common';
import { Gadget, GadgetOutcome } from './gadget.interface';
import { InvoicesRepository } from './invoices.repository';

export type CompareInvoicesParams = {
  invoiceIdA: string;
  invoiceIdB: string;
};

@Injectable()
export class CompareInvoicesGadget implements Gadget<CompareInvoicesParams> {
  readonly name = 'compare_invoices';
  readonly description =
    'Compare two invoices field by field (number, counterparty, amount, issue date). ' +
    'Returns both invoices and a match flag per field. Use this to verify a suspected ' +
    'duplicate before flagging it.';
  readonly paramsSchema = {
    type: 'object',
    properties: {
      invoiceIdA: { type: 'string', description: 'Id of the first invoice.' },
      invoiceIdB: { type: 'string', description: 'Id of the second invoice.' },
    },
    required: ['invoiceIdA', 'invoiceIdB'],
    additionalProperties: false,
  };

  constructor(private readonly invoices: InvoicesRepository) {}

  execute(params: CompareInvoicesParams): Promise<GadgetOutcome> {
    const a = this.invoices.findById(params.invoiceIdA);
    const b = this.invoices.findById(params.invoiceIdB);
    if (!a || !b) {
      const missing = [!a && params.invoiceIdA, !b && params.invoiceIdB]
        .filter(Boolean)
        .join(', ');
      return Promise.resolve({
        ok: false,
        error: `Unknown invoice id(s): ${missing}`,
      });
    }
    return Promise.resolve({
      ok: true,
      value: {
        a,
        b,
        matches: {
          number: normalizeNumber(a.number) === normalizeNumber(b.number),
          counterparty: a.counterparty === b.counterparty,
          amount: a.amount === b.amount,
          issueDate: a.issueDate === b.issueDate,
        },
      },
    });
  }
}

/** 'FT 2026/0159' and 'FT-2026/0159' are the same number typed differently. */
function normalizeNumber(value: string): string {
  return value.replace(/[\s\-./]/g, '').toUpperCase();
}
