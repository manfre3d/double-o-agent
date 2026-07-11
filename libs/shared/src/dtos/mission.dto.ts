export type MissionType = 'duplicate-hunt';

export interface StartMissionRequestDto {
  type: MissionType;
}

export interface StartMissionResponseDto {
  missionId: string;
  /** Dossier code shown in HQ, e.g. '007-001'. */
  code: string;
}
