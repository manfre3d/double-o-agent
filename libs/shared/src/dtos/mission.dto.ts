import type { ExtractedInvoiceDto, FlaggedInvoiceDto } from './invoice.dto';

export type MissionType = 'duplicate-hunt' | 'extraction';

export type MissionStatus = 'running' | 'completed' | 'failed';

export interface StartMissionRequestDto {
  type: MissionType;
  /** Force the scripted demo brain even when a live key is present. */
  demo?: boolean;
}

export interface StartMissionResponseDto {
  missionId: string;
  /** Dossier code shown in HQ, e.g. '007-001'. */
  code: string;
}

/** One entry in the mission history (dossier archive). */
export interface MissionSummaryDto {
  missionId: string;
  code: string;
  type: MissionType;
  /** Mission title — Italian lore string, e.g. 'Caccia ai doppioni'. */
  title: string;
  status: MissionStatus;
  startedAt: string;
  finishedAt?: string;
  /** Stored debrief prose — Italian, per the lore language rule. */
  debrief?: string;
  flagged: FlaggedInvoiceDto[];
  /** Present on completed extraction missions. */
  extracted?: ExtractedInvoiceDto;
}
