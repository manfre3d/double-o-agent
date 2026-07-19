import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { ExtractedInvoiceDto, StoredInvoiceDto } from '@double-o/shared';
import { PrismaService } from '../prisma/prisma.service';

/** Per-session store of invoices a visitor uploaded, hunted over in live mode. */
@Injectable()
export class InvoiceArchiveRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Persists one extracted invoice, assigning the next per-owner code (INV-001…). */
  async add(
    ownerId: string,
    invoice: ExtractedInvoiceDto,
    sourceFilename: string,
  ): Promise<StoredInvoiceDto> {
    const count = await this.prisma.invoice.count({ where: { ownerId } });
    const code = `INV-${String(count + 1).padStart(3, '0')}`;
    await this.prisma.invoice.create({
      data: {
        id: randomUUID(),
        ownerId,
        code,
        number: invoice.number,
        counterparty: invoice.counterparty,
        amount: invoice.amount,
        currency: invoice.currency,
        issueDate: invoice.issueDate,
        sourceFilename,
      },
    });
    return { id: code, ...invoice, sourceFilename };
  }

  /** The owner's batch, oldest first; `code` is the LLM-facing id (InvoiceDto.id). */
  async listByOwner(ownerId: string): Promise<StoredInvoiceDto[]> {
    const rows = await this.prisma.invoice.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((row) => ({
      id: row.code,
      number: row.number,
      counterparty: row.counterparty,
      amount: row.amount,
      currency: row.currency,
      issueDate: row.issueDate,
      sourceFilename: row.sourceFilename ?? undefined,
    }));
  }

  async clearByOwner(ownerId: string): Promise<number> {
    const { count } = await this.prisma.invoice.deleteMany({
      where: { ownerId },
    });
    return count;
  }

  /** Retention sweep: drop invoices uploaded before the cutoff. Returns rows removed. */
  async deleteOlderThan(cutoff: Date): Promise<number> {
    const { count } = await this.prisma.invoice.deleteMany({
      where: { createdAt: { lt: cutoff } },
    });
    return count;
  }
}
