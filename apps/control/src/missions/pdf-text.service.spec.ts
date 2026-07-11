import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { BadRequestException } from '@nestjs/common';
import { PdfTextService } from './pdf-text.service';

describe('PdfTextService', () => {
  const service = new PdfTextService();

  it('extracts the text layer of the sample invoice', async () => {
    const pdf = readFileSync(
      join(__dirname, '../../test/fixtures/fattura-di-prova.pdf'),
    );
    const text = await service.extract(pdf);
    expect(text).toContain('FT-2026/0203');
    expect(text).toContain('Officine Meccaniche Franchi');
    expect(text).toContain('1.842,20');
  });

  it('rejects files that are not readable PDFs', async () => {
    await expect(service.extract(Buffer.from('not a pdf'))).rejects.toThrow(
      BadRequestException,
    );
  });
});
