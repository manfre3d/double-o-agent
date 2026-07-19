import { Injectable } from '@nestjs/common';
import { Gadget, GadgetOutcome, MissionContext } from './gadget.interface';

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

  execute(
    _params: Record<string, unknown>,
    ctx: MissionContext,
  ): Promise<GadgetOutcome> {
    // Copy so list_invoices' returned value can't be mutated through the batch.
    return Promise.resolve({ ok: true, value: [...ctx.invoices] });
  }
}
