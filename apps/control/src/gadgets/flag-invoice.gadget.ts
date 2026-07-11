import { Injectable } from '@nestjs/common';
import { Gadget, GadgetOutcome, MissionContext } from './gadget.interface';
import { InvoicesRepository } from './invoices.repository';

export type FlagInvoiceParams = {
  invoiceId: string;
  reason: string;
};

@Injectable()
export class FlagInvoiceGadget implements Gadget<FlagInvoiceParams> {
  readonly name = 'flag_invoice';
  readonly description =
    'Flag an invoice as a duplicate entry to be removed from the batch. Flag the ' +
    'redundant copy, not the original. The reason is shown to the user in the mission ' +
    'report, so write it in Italian.';
  readonly paramsSchema = {
    type: 'object',
    properties: {
      invoiceId: { type: 'string', description: 'Id of the invoice to flag.' },
      reason: {
        type: 'string',
        description: 'Why this invoice is a duplicate, in Italian.',
      },
    },
    required: ['invoiceId', 'reason'],
    additionalProperties: false,
  };

  constructor(private readonly invoices: InvoicesRepository) {}

  execute(
    params: FlagInvoiceParams,
    ctx: MissionContext,
  ): Promise<GadgetOutcome> {
    if (!this.invoices.findById(params.invoiceId)) {
      return Promise.resolve({
        ok: false,
        error: `Unknown invoice id: ${params.invoiceId}`,
      });
    }
    if (ctx.flagged.some((f) => f.invoiceId === params.invoiceId)) {
      return Promise.resolve({
        ok: false,
        error: `Invoice ${params.invoiceId} is already flagged.`,
      });
    }
    ctx.flagged.push({ invoiceId: params.invoiceId, reason: params.reason });
    return Promise.resolve({ ok: true, value: { flagged: params.invoiceId } });
  }
}
