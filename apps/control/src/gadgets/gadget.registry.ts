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
import { ReadDocumentGadget } from './read-document.gadget';
import { RecordInvoiceGadget } from './record-invoice.gadget';

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
    readDocument: ReadDocumentGadget,
    recordInvoice: RecordInvoiceGadget,
  ) {
    this.gadgets = [
      listInvoices,
      compareInvoices,
      flagInvoice,
      readDocument,
      recordInvoice,
    ];
  }

  /** Definitions for the LLM; `only` limits them to the mission's gadget set. */
  toolDefinitions(only?: string[]): ToolDefinition[] {
    const exposed = only
      ? this.gadgets.filter((g) => only.includes(g.name))
      : this.gadgets;
    return exposed.map((g) => ({
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
