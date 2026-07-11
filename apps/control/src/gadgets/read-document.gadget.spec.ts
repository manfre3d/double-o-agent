import { ReadDocumentGadget } from './read-document.gadget';
import { MissionContext } from './gadget.interface';

describe('ReadDocumentGadget', () => {
  const gadget = new ReadDocumentGadget();

  it('returns the attached document', async () => {
    const ctx: MissionContext = {
      missionId: 'm1',
      flagged: [],
      document: { filename: 'fattura.pdf', text: 'Fattura n. 12' },
    };
    const outcome = await gadget.execute({}, ctx);
    expect(outcome).toEqual({
      ok: true,
      value: { filename: 'fattura.pdf', text: 'Fattura n. 12' },
    });
  });

  it('fails when the mission has no document', async () => {
    const outcome = await gadget.execute({}, { missionId: 'm1', flagged: [] });
    expect(outcome).toEqual({
      ok: false,
      error: 'No document is attached to this mission.',
    });
  });
});
