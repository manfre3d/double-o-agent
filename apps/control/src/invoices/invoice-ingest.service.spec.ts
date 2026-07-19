import { InvoiceIngestService } from './invoice-ingest.service';
import { AgentLoopService } from '../agent/agent-loop.service';
import { InvoiceArchiveRepository } from './invoice-archive.repository';

const EXTRACTED = {
  number: 'FT-1',
  counterparty: 'Rossi S.r.l.',
  amount: 100,
  currency: 'EUR',
  issueDate: '2026-06-18',
};

function build(debriefExtracted?: typeof EXTRACTED) {
  const run = jest.fn(
    (_spec: unknown, emit: (draft: Record<string, unknown>) => void) => {
      emit({
        type: 'debrief',
        text: 'Fine.',
        flagged: [],
        ...(debriefExtracted ? { extracted: debriefExtracted } : {}),
      });
      return Promise.resolve();
    },
  );
  const archive = {
    add: jest.fn((ownerId: string, inv: typeof EXTRACTED, filename: string) =>
      Promise.resolve({ id: 'INV-001', ...inv, sourceFilename: filename }),
    ),
  };
  const service = new InvoiceIngestService(
    { run } as unknown as AgentLoopService,
    archive as unknown as InvoiceArchiveRepository,
  );
  return { service, run, archive };
}

describe('InvoiceIngestService', () => {
  it('extracts on the live brain and persists the invoice', async () => {
    const { service, run, archive } = build(EXTRACTED);
    const result = await service.ingest('owner-a', {
      filename: 'f.pdf',
      text: 'Fattura…',
    });

    expect(run).toHaveBeenCalledWith(expect.anything(), expect.any(Function), {
      demo: false,
    });
    expect(archive.add).toHaveBeenCalledWith('owner-a', EXTRACTED, 'f.pdf');
    expect(result).toMatchObject({ id: 'INV-001', sourceFilename: 'f.pdf' });
  });

  it('stores nothing and returns null when the document is not an invoice', async () => {
    const { service, archive } = build(undefined);
    const result = await service.ingest('owner-a', {
      filename: 'quote.pdf',
      text: 'Preventivo…',
    });

    expect(result).toBeNull();
    expect(archive.add).not.toHaveBeenCalled();
  });
});
