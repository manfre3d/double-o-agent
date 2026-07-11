import { Injectable } from '@nestjs/common';
import type { ExtractedInvoiceDto } from '@double-o/shared';
import { Gadget, GadgetOutcome, MissionContext } from './gadget.interface';

/**
 * Same fields as ExtractedInvoiceDto, remapped because interfaces have no
 * implicit index signature and would not satisfy Gadget's params bound.
 */
export type RecordInvoiceParams = Pick<
  ExtractedInvoiceDto,
  keyof ExtractedInvoiceDto
>;

@Injectable()
export class RecordInvoiceGadget implements Gadget<RecordInvoiceParams> {
  readonly name = 'record_invoice';
  readonly description =
    'Record the structured invoice data extracted from the mission document, using the ' +
    'exact values found in the text. Call it once, after reading the document; the record ' +
    'becomes the mission result shown to the user.';
  readonly paramsSchema = {
    type: 'object',
    properties: {
      number: {
        type: 'string',
        description: "Supplier's invoice number, exactly as printed.",
      },
      counterparty: {
        type: 'string',
        description:
          'Name of the supplier who issued the invoice — never the customer ' +
          'it is billed to.',
      },
      amount: {
        type: 'number',
        description: 'Total amount due, as a decimal number.',
      },
      currency: {
        type: 'string',
        description: 'ISO-4217 currency code, e.g. EUR.',
      },
      issueDate: {
        type: 'string',
        description: 'Issue date in ISO-8601 format (YYYY-MM-DD).',
      },
    },
    required: ['number', 'counterparty', 'amount', 'currency', 'issueDate'],
    additionalProperties: false,
  };

  execute(
    params: RecordInvoiceParams,
    ctx: MissionContext,
  ): Promise<GadgetOutcome> {
    const problems: string[] = [];
    if (!params.number?.trim()) {
      problems.push('number is empty');
    }
    if (!params.counterparty?.trim()) {
      problems.push('counterparty is empty');
    }
    if (!Number.isFinite(params.amount) || params.amount <= 0) {
      problems.push('amount must be a positive number');
    }
    if (!/^[A-Za-z]{3}$/.test(params.currency ?? '')) {
      problems.push('currency must be a 3-letter ISO-4217 code');
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(params.issueDate ?? '')) {
      problems.push('issueDate must be YYYY-MM-DD');
    }
    if (problems.length > 0) {
      return Promise.resolve({
        ok: false,
        error: `Invalid invoice record: ${problems.join('; ')}.`,
      });
    }
    ctx.extracted = {
      number: params.number.trim(),
      counterparty: params.counterparty.trim(),
      amount: params.amount,
      currency: params.currency.toUpperCase(),
      issueDate: params.issueDate,
    };
    return Promise.resolve({ ok: true, value: { recorded: ctx.extracted } });
  }
}
