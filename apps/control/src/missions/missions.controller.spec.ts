import { BadRequestException } from '@nestjs/common';
import { MissionsController } from './missions.controller';
import { MissionsService } from './missions.service';

const NEWLINE = String.fromCharCode(10);
const NUL = String.fromCharCode(0);

function build() {
  const missions = {
    start: jest.fn().mockResolvedValue({ missionId: 'm', code: '007-001' }),
    startExtraction: jest
      .fn()
      .mockResolvedValue({ missionId: 'm', code: '007-001' }),
  };
  const pdf = { extract: jest.fn().mockResolvedValue('Fattura n. FT-1 …') };
  const controller = new MissionsController(
    missions as unknown as MissionsService,
    pdf,
  );
  return { controller, missions, pdf };
}

function pdfFile(
  overrides: Partial<Express.Multer.File> = {},
): Express.Multer.File {
  return {
    buffer: Buffer.from('%PDF-1.7 sample pdf bytes'),
    originalname: 'fattura.pdf',
    mimetype: 'application/pdf',
    ...overrides,
  } as Express.Multer.File;
}

describe('MissionsController (upload hardening + owner wiring)', () => {
  it('rejects a payload without the %PDF- signature, even if the mimetype lies', async () => {
    const { controller, pdf } = build();
    const bogus = pdfFile({
      buffer: Buffer.from('<html>not a pdf</html>'),
      mimetype: 'application/pdf',
    });
    await expect(controller.extract('owner', bogus)).rejects.toThrow(
      BadRequestException,
    );
    expect(pdf.extract).not.toHaveBeenCalled();
  });

  it('rejects a missing file', async () => {
    const { controller } = build();
    await expect(controller.extract('owner', undefined)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('accepts a real PDF and sanitizes the filename before use', async () => {
    const { controller, missions } = build();
    const nasty =
      ('../../etc/pa' + NUL + 'ss' + NEWLINE + 'wd').padEnd(140, 'x') + '.pdf';
    const file = pdfFile({ originalname: nasty });

    await controller.extract('owner-x', file);

    expect(missions.startExtraction).toHaveBeenCalledTimes(1);
    const [doc, owner] = missions.startExtraction.mock.calls[0] as [
      { filename: string },
      string,
    ];
    expect(owner).toBe('owner-x');
    expect(doc.filename).not.toContain('/'); // path separators dropped
    expect(doc.filename).not.toContain(NEWLINE); // control chars stripped
    expect(doc.filename).not.toContain(NUL);
    expect(doc.filename.length).toBeLessThanOrEqual(100); // length capped
  });

  it('forwards the session owner when starting a duplicate hunt', async () => {
    const { controller, missions } = build();
    await controller.start({ type: 'duplicate-hunt' }, 'owner-y');
    expect(missions.start).toHaveBeenCalledWith('duplicate-hunt', 'owner-y');
  });
});
