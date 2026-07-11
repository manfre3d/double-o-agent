import { Injectable } from '@nestjs/common';
import { Gadget, GadgetOutcome, MissionContext } from './gadget.interface';

@Injectable()
export class ReadDocumentGadget implements Gadget {
  readonly name = 'read_document';
  readonly description =
    'Read the full text of the document attached to this mission (already extracted ' +
    'from the uploaded PDF). Call it once, before drawing any conclusion about the document.';
  readonly paramsSchema = {
    type: 'object',
    properties: {},
    additionalProperties: false,
  };

  execute(
    _params: Record<string, unknown>,
    ctx: MissionContext,
  ): Promise<GadgetOutcome> {
    if (!ctx.document) {
      return Promise.resolve({
        ok: false,
        error: 'No document is attached to this mission.',
      });
    }
    return Promise.resolve({ ok: true, value: ctx.document });
  }
}
