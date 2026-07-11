import { Injectable } from '@nestjs/common';
import type { Prisma } from '../generated/prisma/client';
import type {
  ExtractedInvoiceDto,
  FlaggedInvoiceDto,
  GadgetUsageDto,
  MissionEvent,
  MissionStatus,
  MissionSummaryDto,
  MissionType,
} from '@double-o/shared';
import { PrismaService } from '../prisma/prisma.service';

/** One GROUP BY (type, status) bucket; avgMs is null when none have finished. */
export interface MissionTypeStatusRow {
  type: string;
  status: string;
  count: number;
  avgMs: number | null;
}

export interface MissionAnalyticsRows {
  typeStatus: MissionTypeStatusRow[];
  gadgets: GadgetUsageDto[];
  flaggedInvoices: number;
}

@Injectable()
export class MissionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(mission: {
    id: string;
    code: string;
    type: MissionType;
  }): Promise<void> {
    await this.prisma.mission.create({ data: mission });
  }

  async nextCodeNumber(): Promise<number> {
    return (await this.prisma.mission.count()) + 1;
  }

  async appendEvent(event: MissionEvent): Promise<void> {
    await this.prisma.missionEvent.create({
      data: {
        missionId: event.missionId,
        seq: event.seq,
        type: event.type,
        payload: event as unknown as Prisma.InputJsonValue,
        at: new Date(event.at),
      },
    });
  }

  async finish(
    missionId: string,
    outcome: {
      status: MissionStatus;
      debrief?: string;
      flagged: FlaggedInvoiceDto[];
      extracted?: ExtractedInvoiceDto;
    },
  ): Promise<void> {
    await this.prisma.mission.update({
      where: { id: missionId },
      data: {
        status: outcome.status,
        debrief: outcome.debrief,
        flagged: outcome.flagged as unknown as Prisma.InputJsonValue,
        extracted: outcome.extracted as unknown as Prisma.InputJsonValue,
        finishedAt: new Date(),
      },
    });
  }

  async list(): Promise<Omit<MissionSummaryDto, 'title'>[]> {
    const rows = await this.prisma.mission.findMany({
      orderBy: { startedAt: 'desc' },
    });
    return rows.map((row) => ({
      missionId: row.id,
      code: row.code,
      type: row.type as MissionType,
      status: row.status as MissionStatus,
      startedAt: row.startedAt.toISOString(),
      finishedAt: row.finishedAt?.toISOString(),
      debrief: row.debrief ?? undefined,
      flagged: row.flagged as unknown as FlaggedInvoiceDto[],
      extracted: (row.extracted ?? undefined) as
        ExtractedInvoiceDto | undefined,
    }));
  }

  /** Aggregation happens in Postgres (GROUP BY / FILTER / jsonb), not in Node. */
  async analytics(): Promise<MissionAnalyticsRows> {
    const [typeStatus, gadgets, flaggedRows] = await Promise.all([
      this.prisma.$queryRaw<MissionTypeStatusRow[]>`
        SELECT "type", "status", COUNT(*)::int AS "count",
               AVG(EXTRACT(EPOCH FROM ("finishedAt" - "startedAt")) * 1000)::float AS "avgMs"
        FROM "Mission"
        GROUP BY "type", "status"`,
      this.prisma.$queryRaw<GadgetUsageDto[]>`
        SELECT "payload"->>'gadget' AS "gadget",
               COUNT(*)::int AS "calls",
               (COUNT(*) FILTER (WHERE "payload"->>'ok' = 'false'))::int AS "failures"
        FROM "MissionEvent"
        WHERE "type" = 'gadget_result'
        GROUP BY 1
        ORDER BY "calls" DESC, "gadget"`,
      this.prisma.$queryRaw<{ total: number }[]>`
        SELECT COALESCE(SUM(jsonb_array_length("flagged")), 0)::int AS "total"
        FROM "Mission"`,
    ]);
    return { typeStatus, gadgets, flaggedInvoices: flaggedRows[0]?.total ?? 0 };
  }

  async exists(missionId: string): Promise<boolean> {
    const count = await this.prisma.mission.count({ where: { id: missionId } });
    return count > 0;
  }

  async getEvents(missionId: string): Promise<MissionEvent[]> {
    const rows = await this.prisma.missionEvent.findMany({
      where: { missionId },
      orderBy: { seq: 'asc' },
    });
    return rows.map((row) => row.payload as unknown as MissionEvent);
  }
}
