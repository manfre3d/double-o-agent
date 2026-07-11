export interface StatusReportDto {
  codename: string;
  status: 'operational' | 'offline';
  /** Shown to users in HQ — Italian, per the lore language rule. */
  message: string;
  /** ISO-8601 timestamp. */
  reportedAt: string;
}
