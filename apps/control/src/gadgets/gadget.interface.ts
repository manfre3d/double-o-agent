import type { FlaggedInvoiceDto } from '@double-o/shared';

export type JsonSchema = Record<string, unknown>;

/** Per-mission state passed to every gadget execution. */
export interface MissionContext {
  missionId: string;
  flagged: FlaggedInvoiceDto[];
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
