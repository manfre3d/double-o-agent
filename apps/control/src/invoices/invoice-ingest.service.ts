import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { ExtractedInvoiceDto, StoredInvoiceDto } from '@double-o/shared';
import { AgentLoopService } from '../agent/agent-loop.service';
import { MissionDocument } from '../gadgets/gadget.interface';
import { extractionBrief } from '../missions/mission-briefs';
import { InvoiceArchiveRepository } from './invoice-archive.repository';

/** Turns an uploaded PDF into a stored invoice by reusing the extraction agent
 *  loop headlessly (no SSE) — same brain/gadgets as a streamed extraction. */
@Injectable()
export class InvoiceIngestService {
  constructor(
    private readonly agentLoop: AgentLoopService,
    private readonly archive: InvoiceArchiveRepository,
  ) {}

  /** Extracts and persists one invoice; returns null when the document is not an
   *  invoice (quote, receipt, …) or extraction produced nothing. Runs on the live
   *  brain — callers must gate on LLM_LIVE_AVAILABLE. */
  async ingest(
    ownerId: string,
    document: MissionDocument,
  ): Promise<StoredInvoiceDto | null> {
    let extracted: ExtractedInvoiceDto | undefined;
    await this.agentLoop.run(
      {
        missionId: `ingest-${randomUUID()}`,
        code: 'ingest',
        ...extractionBrief(document),
      },
      (draft) => {
        if (draft.type === 'debrief' && draft.extracted) {
          extracted = draft.extracted;
        }
      },
      { demo: false },
    );
    if (!extracted) {
      return null;
    }
    return this.archive.add(ownerId, extracted, document.filename);
  }
}
