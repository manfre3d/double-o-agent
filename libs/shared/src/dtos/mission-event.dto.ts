import type { FlaggedInvoiceDto } from './invoice.dto';

export const MISSION_EVENT_TYPES = [
  'briefing',
  'thinking',
  'gadget_call',
  'gadget_result',
  'debrief',
  'error',
] as const;

export type MissionEventType = (typeof MISSION_EVENT_TYPES)[number];

interface MissionEventBase {
  missionId: string;
  seq: number;
  /** ISO-8601 timestamp. */
  at: string;
}

/** Lore fields (`title`, `objective`) are Italian, per the language rule. */
export interface BriefingEvent extends MissionEventBase {
  type: 'briefing';
  code: string;
  title: string;
  objective: string;
}

export interface ThinkingEvent extends MissionEventBase {
  type: 'thinking';
  text: string;
}

export interface GadgetCallEvent extends MissionEventBase {
  type: 'gadget_call';
  gadget: string;
  params: Record<string, unknown>;
}

export interface GadgetResultEvent extends MissionEventBase {
  type: 'gadget_result';
  gadget: string;
  ok: boolean;
  result?: unknown;
  error?: string;
}

export interface DebriefEvent extends MissionEventBase {
  type: 'debrief';
  text: string;
  flagged: FlaggedInvoiceDto[];
}

export interface MissionErrorEvent extends MissionEventBase {
  type: 'error';
  message: string;
}

export type MissionEvent =
  | BriefingEvent
  | ThinkingEvent
  | GadgetCallEvent
  | GadgetResultEvent
  | DebriefEvent
  | MissionErrorEvent;
