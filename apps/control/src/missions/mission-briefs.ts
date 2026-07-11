import type { MissionType } from '@double-o/shared';
import type { MissionRunSpec } from '../agent/agent-loop.service';
import type { MissionDocument } from '../gadgets/gadget.interface';

/**
 * The production mission briefs (prompts + gadget allowlists), separated from
 * MissionsService so the Q Branch eval harness scores the exact briefs that
 * live missions run with.
 */

export type MissionBrief = Omit<MissionRunSpec, 'missionId' | 'code'>;

export const MISSION_TITLES: Record<MissionType, string> = {
  'duplicate-hunt': 'Caccia ai doppioni',
  extraction: 'Decifrazione del dossier',
};

/** Missions startable without an attached document. */
export const MISSION_BRIEFS: Partial<Record<MissionType, MissionBrief>> = {
  'duplicate-hunt': {
    title: MISSION_TITLES['duplicate-hunt'],
    objective:
      'Individuare e segnalare le fatture registrate due volte nel lotto corrente.',
    task: 'Begin the duplicate hunt on the current invoice batch.',
    instructions: `Your mission: hunt duplicate invoices in the current batch.
- A duplicate is the same supplier invoice entered more than once; formatting differences in the invoice number or a one-day date slip do not make two entries distinct.
- Verify every suspicion with compare_invoices before flagging.
- Flag only when the comparison reports number, counterparty and amount all matching (issueDate alone may differ by one day). If the number does not match, the entries are different invoices — a recurring charge from the same supplier, or an amount coincidence — and must not be flagged.
- Flag the redundant copy, not the original, and name invoices inline by their id.
- In the debrief, summarize what was scanned, what was flagged and why.`,
    gadgets: ['list_invoices', 'compare_invoices', 'flag_invoice'],
  },
};

const EXTRACTION_INSTRUCTIONS = `Your mission: extract the invoice data from the attached document.
- Read the document, locate the supplier invoice fields, and record them with record_invoice using the exact values printed in the text.
- The counterparty is the supplier who issued the invoice (its name usually heads the document); it is never the customer marked as the recipient ("cliente", "spett.le", "destinatario").
- Convert amounts to plain decimal numbers; if several amounts appear, record the total due.
- Record only values printed in the text — never guess or invent a field.
- Only a real invoice (fattura) gets recorded. A quote ("preventivo"), order, delivery note, receipt or payment reminder is not an invoice: for those, never call record_invoice — end the mission with a debrief explaining what the document is.
- In the debrief, state the recorded fields and anything unusual about the document.`;

export function extractionBrief(document: MissionDocument): MissionBrief {
  return {
    title: MISSION_TITLES.extraction,
    objective: `Decifrare il dossier «${document.filename}» ed estrarre i dati della fattura.`,
    task: `Extract the invoice data from the attached document "${document.filename}".`,
    instructions: EXTRACTION_INSTRUCTIONS,
    gadgets: ['read_document', 'record_invoice'],
    document,
  };
}
