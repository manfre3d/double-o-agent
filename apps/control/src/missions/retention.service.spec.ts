import { ConfigService } from '@nestjs/config';
import { RetentionService } from './retention.service';
import { MissionsRepository } from './missions.repository';
import { InvoiceArchiveRepository } from '../invoices/invoice-archive.repository';

function build(retentionHours?: string) {
  const repo = { deleteOlderThan: jest.fn().mockResolvedValue(3) };
  const invoices = { deleteOlderThan: jest.fn().mockResolvedValue(2) };
  const config = {
    get: (key: string) =>
      key === 'MISSION_RETENTION_HOURS' ? retentionHours : undefined,
  } as unknown as ConfigService;
  const service = new RetentionService(
    repo as unknown as MissionsRepository,
    invoices as unknown as InvoiceArchiveRepository,
    config,
  );
  return { service, repo, invoices };
}

describe('RetentionService', () => {
  it('purges missions and invoices older than the configured retention window', async () => {
    const { service, repo, invoices } = build('24');
    const expected = Date.now() - 24 * 60 * 60 * 1000;

    await service.purge();

    expect(repo.deleteOlderThan).toHaveBeenCalledTimes(1);
    expect(invoices.deleteOlderThan).toHaveBeenCalledTimes(1);
    const [cutoff] = repo.deleteOlderThan.mock.calls[0] as [Date];
    const [invoiceCutoff] = invoices.deleteOlderThan.mock.calls[0] as [Date];
    expect(Math.abs(cutoff.getTime() - expected)).toBeLessThan(5_000);
    expect(Math.abs(invoiceCutoff.getTime() - expected)).toBeLessThan(5_000);
  });

  it('falls back to the 72h default when unset', async () => {
    const { service, repo } = build(undefined);
    const expected = Date.now() - 72 * 60 * 60 * 1000;

    await service.purge();

    const [cutoff] = repo.deleteOlderThan.mock.calls[0] as [Date];
    expect(Math.abs(cutoff.getTime() - expected)).toBeLessThan(5_000);
  });
});
