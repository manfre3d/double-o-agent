import type { ExtractedInvoiceDto, FlaggedInvoiceDto } from '@double-o/shared';

export type JsonSchema = Record<string, unknown>;

/** Text extracted from an uploaded PDF, attached to extraction missions. */
export interface MissionDocument {
  filename: string;
  text: string;
}

/** Per-mission state passed to every gadget execution. */
export interface MissionContext {
  missionId: string;
  flagged: FlaggedInvoiceDto[];
  document?: MissionDocument;
  /** Set by record_invoice on extraction missions. */
  extracted?: ExtractedInvoiceDto;
}

export type GadgetOutcome =
  { ok: true; value: unknown } | { ok: false; error: string };

/**
 * A tool the agent can call. `name` and `description` are English and
 * literal — the description is a prompt for the LLM, not UI copy.
 */
export interface Gadget<TParams = Record<string, unknown>> {
  readonly name: string;
  readonly description: string;
  readonly paramsSchema: JsonSchema;
  execute(params: TParams, ctx: MissionContext): Promise<GadgetOutcome>;
}
