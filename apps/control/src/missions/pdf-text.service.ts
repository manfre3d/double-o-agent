import { BadRequestException, Injectable } from '@nestjs/common';
import { PDFParse } from 'pdf-parse';

/** Extracts the text layer of an uploaded PDF (no OCR: scans come out empty). */
@Injectable()
export class PdfTextService {
  async extract(data: Buffer): Promise<string> {
    const parser = new PDFParse({ data });
    try {
      const result = await parser.getText();
      const text = result.text.trim();
      if (!text) {
        throw new BadRequestException('The PDF has no extractable text layer.');
      }
      return text;
    } catch (err) {
      if (err instanceof BadRequestException) {
        throw err;
      }
      throw new BadRequestException('The file is not a readable PDF.');
    } finally {
      await parser.destroy();
    }
  }
}
