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
    ownerId: string;
    code: string;
    type: MissionType;
  }): Promise<void> {
    await this.prisma.mission.create({ data: mission });
  }

  /** Per-owner sequence, so each session's dossiers count from 007-001. */
  async nextCodeNumber(ownerId: string): Promise<number> {
    return (await this.prisma.mission.count({ where: { ownerId } })) + 1;
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

  async list(ownerId: string): Promise<Omit<MissionSummaryDto, 'title'>[]> {
    const rows = await this.prisma.mission.findMany({
      where: { ownerId },
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

  /** Aggregation happens in Postgres (GROUP BY / FILTER / jsonb), not in Node.
   *  Every query is scoped to the owner; the events roll-up joins back to Mission
   *  because MissionEvent carries no owner of its own. */
  async analytics(ownerId: string): Promise<MissionAnalyticsRows> {
    const [typeStatus, gadgets, flaggedRows] = await Promise.all([
      this.prisma.$queryRaw<MissionTypeStatusRow[]>`
        SELECT "type", "status", COUNT(*)::int AS "count",
               AVG(EXTRACT(EPOCH FROM ("finishedAt" - "startedAt")) * 1000)::float AS "avgMs"
        FROM "Mission"
        WHERE "ownerId" = ${ownerId}
        GROUP BY "type", "status"`,
      this.prisma.$queryRaw<GadgetUsageDto[]>`
        SELECT e."payload"->>'gadget' AS "gadget",
               COUNT(*)::int AS "calls",
               (COUNT(*) FILTER (WHERE e."payload"->>'ok' = 'false'))::int AS "failures"
        FROM "MissionEvent" e
        JOIN "Mission" m ON m."id" = e."missionId"
        WHERE e."type" = 'gadget_result' AND m."ownerId" = ${ownerId}
        GROUP BY 1
        ORDER BY "calls" DESC, "gadget"`,
      this.prisma.$queryRaw<{ total: number }[]>`
        SELECT COALESCE(SUM(jsonb_array_length("flagged")), 0)::int AS "total"
        FROM "Mission"
        WHERE "ownerId" = ${ownerId}`,
    ]);
    return { typeStatus, gadgets, flaggedInvoices: flaggedRows[0]?.total ?? 0 };
  }

  async exists(missionId: string, ownerId: string): Promise<boolean> {
    const count = await this.prisma.mission.count({
      where: { id: missionId, ownerId },
    });
    return count > 0;
  }

  async getEvents(missionId: string): Promise<MissionEvent[]> {
    const rows = await this.prisma.missionEvent.findMany({
      where: { missionId },
      orderBy: { seq: 'asc' },
    });
    return rows.map((row) => row.payload as unknown as MissionEvent);
  }

  /** Retention sweep: events cascade via the Mission FK. Returns rows removed. */
  async deleteOlderThan(cutoff: Date): Promise<number> {
    const { count } = await this.prisma.mission.deleteMany({
      where: { startedAt: { lt: cutoff } },
    });
    return count;
  }
}
