import { Injectable } from '@nestjs/common';
import {
  Gadget,
  GadgetOutcome,
  JsonSchema,
  MissionContext,
} from './gadget.interface';
import { ListInvoicesGadget } from './list-invoices.gadget';
import { CompareInvoicesGadget } from './compare-invoices.gadget';
import { FlagInvoiceGadget } from './flag-invoice.gadget';

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: JsonSchema;
}

/** The single list of gadgets the agent loop exposes to the LLM. */
@Injectable()
export class GadgetRegistry {
  private readonly gadgets: Gadget[];

  constructor(
    listInvoices: ListInvoicesGadget,
    compareInvoices: CompareInvoicesGadget,
    flagInvoice: FlagInvoiceGadget,
  ) {
    this.gadgets = [listInvoices, compareInvoices, flagInvoice];
  }

  toolDefinitions(): ToolDefinition[] {
    return this.gadgets.map((g) => ({
      name: g.name,
      description: g.description,
      parameters: g.paramsSchema,
    }));
  }

  async execute(
    name: string,
    params: Record<string, unknown>,
    ctx: MissionContext,
  ): Promise<GadgetOutcome> {
    const gadget = this.gadgets.find((g) => g.name === name);
    if (!gadget) {
      return { ok: false, error: `Unknown gadget: ${name}` };
    }
    try {
      return await gadget.execute(params, ctx);
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }
}
