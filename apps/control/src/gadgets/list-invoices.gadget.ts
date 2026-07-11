import { Injectable } from '@nestjs/common';
import { Gadget, GadgetOutcome } from './gadget.interface';
import { InvoicesRepository } from './invoices.repository';

@Injectable()
export class ListInvoicesGadget implements Gadget {
  readonly name = 'list_invoices';
  readonly description =
    'List every invoice in the current batch. Returns id, number, counterparty, ' +
    'amount, currency and issue date for each invoice. Call this first to see the data.';
  readonly paramsSchema = {
    type: 'object',
    properties: {},
    additionalProperties: false,
  };

  constructor(private readonly invoices: InvoicesRepository) {}

  execute(): Promise<GadgetOutcome> {
    return Promise.resolve({ ok: true, value: this.invoices.findAll() });
  }
}
