import { BadRequestException } from '@nestjs/common';
import { InvoicesController } from './invoices.controller';
import { InvoiceIngestService } from './invoice-ingest.service';
import { InvoiceArchiveRepository } from './invoice-archive.repository';

function pdfFile(
  overrides: Partial<Express.Multer.File> = {},
): Express.Multer.File {
  return {
    buffer: Buffer.from('%PDF-1.7 sample'),
    originalname: 'fattura.pdf',
    mimetype: 'application/pdf',
    ...overrides,
  } as Express.Multer.File;
}

function build(liveAvailable = true) {
  const ingest = { ingest: jest.fn() };
  const archive = {
    listByOwner: jest.fn().mockResolvedValue([]),
    clearByOwner: jest.fn().mockResolvedValue(0),
  };
  const pdfText = { extract: jest.fn().mockResolvedValue('Fattura…') };
  const controller = new InvoicesController(
    ingest as unknown as InvoiceIngestService,
    archive as unknown as InvoiceArchiveRepository,
    pdfText,
    liveAvailable,
  );
  return { controller, ingest, archive, pdfText };
}

describe('InvoicesController', () => {
  it('rejects upload when no live brain is configured', async () => {
    const { controller } = build(false);
    await expect(controller.upload('owner', [pdfFile()])).rejects.toThrow(
      BadRequestException,
    );
  });

  it('rejects upload with no files', async () => {
    const { controller } = build(true);
    await expect(controller.upload('owner', [])).rejects.toThrow(
      BadRequestException,
    );
    await expect(controller.upload('owner', undefined)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('stores extracted invoices and reports skipped files', async () => {
    const { controller, ingest, pdfText } = build(true);
    ingest.ingest
      .mockResolvedValueOnce({ id: 'INV-001' })
      .mockResolvedValueOnce(null);

    const result = await controller.upload('owner', [
      pdfFile({ originalname: 'a.pdf' }),
      pdfFile({ originalname: 'b.pdf' }),
    ]);

    expect(pdfText.extract).toHaveBeenCalledTimes(2);
    expect(result.added).toBe(1);
    expect(result.skipped).toEqual([
      { filename: 'b.pdf', reason: 'not an invoice' },
    ]);
  });

  it('skips non-PDF payloads without extracting them', async () => {
    const { controller, ingest, pdfText } = build(true);
    const result = await controller.upload('owner', [
      pdfFile({ originalname: 'fake.pdf', buffer: Buffer.from('<html>') }),
    ]);

    expect(pdfText.extract).not.toHaveBeenCalled();
    expect(ingest.ingest).not.toHaveBeenCalled();
    expect(result).toEqual({
      added: 0,
      skipped: [{ filename: 'fake.pdf', reason: 'not a valid PDF' }],
    });
  });

  it('lists and clears the owner batch', async () => {
    const { controller, archive } = build(true);
    await controller.list('owner-x');
    expect(archive.listByOwner).toHaveBeenCalledWith('owner-x');

    archive.clearByOwner.mockResolvedValue(3);
    expect(await controller.clear('owner-x')).toEqual({ cleared: 3 });
    expect(archive.clearByOwner).toHaveBeenCalledWith('owner-x');
  });
});
