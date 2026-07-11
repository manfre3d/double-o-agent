import type { MissionType } from './mission.dto';

/** Per-mission-type slice of the analytics rollup. */
export interface MissionTypeStatsDto {
  type: MissionType;
  /** Mission title — Italian lore string, e.g. 'Caccia ai doppioni'. */
  title: string;
  total: number;
  completed: number;
  failed: number;
  running: number;
  /** Mean wall-clock duration of finished missions, in milliseconds. */
  avgDurationMs?: number;
}

/** How often a gadget was fired across all missions, and how often it broke. */
export interface GadgetUsageDto {
  gadget: string;
  calls: number;
  failures: number;
}

/** Aggregate mission stats for the HQ analytics panel. */
export interface MissionAnalyticsDto {
  totalMissions: number;
  completed: number;
  failed: number;
  running: number;
  /** completed / finished, 0..1; absent until at least one mission finishes. */
  successRate?: number;
  /** Mean duration across all finished missions, in milliseconds. */
  avgDurationMs?: number;
  /** Invoices flagged across all debriefs. */
  flaggedInvoices: number;
  byType: MissionTypeStatsDto[];
  /** Sorted by call count, descending. */
  gadgets: GadgetUsageDto[];
}
