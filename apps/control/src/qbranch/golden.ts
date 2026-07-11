import type { ExtractedInvoiceDto, InvoiceDto } from '@double-o/shared';

/**
 * Q Branch golden set: missions with known correct outcomes, replayed by
 * `npm run eval` (see run-evals.ts). Typed against the shared DTOs so the
 * compiler keeps the expectations in the same shape the agent must produce.
 */

interface GoldenCaseBase {
  /** Lore name, Italian — these are mission names, shown in the report. */
  name: string;
  /** What the case is guarding against, for whoever reads a red report. */
  probes: string;
  /** True when the scripted demo brain replays this case correctly (no API key needed). */
  demo?: boolean;
}

export interface ExtractionGoldenCase extends GoldenCaseBase {
  kind: 'extraction';
  filename: string;
  /** Document text as pdf-parse would extract it (the PDF→text path has its own tests). */
  text: string;
  /** Fields the agent must record — or null when the document is not an invoice. */
  expected: ExtractedInvoiceDto | null;
}

export interface HuntGoldenCase extends GoldenCaseBase {
  kind: 'duplicate-hunt';
  /** Invoice batch under scrutiny; omitted → the production seeded batch. */
  batch?: InvoiceDto[];
  /** Exactly the redundant copies, never the originals. */
  expectedFlagged: string[];
}

export type GoldenCase = ExtractionGoldenCase | HuntGoldenCase;

/** Text layer of apps/control/test/fixtures/fattura-di-prova.pdf, verbatim. */
const SAMPLE_INVOICE_TEXT = `FATTURA
Officine Meccaniche Franchi S.r.l.
Via delle Fucine 12, 25128 Brescia (BS)
P.IVA 03456780987
Fattura n. FT-2026/0203
Data di emissione: 18/06/2026
Cliente: Sartoria Vitale S.n.c.
Corso Magenta 4, 20123 Milano (MI)
Descrizione Importo
Revisione tornio CNC - manodopera 950,00 EUR
Ricambi: cinghie e cuscinetti 480,00 EUR
Trasporto e collaudo in officina 80,00 EUR
Imponibile 1.510,00 EUR
IVA 22% 332,20 EUR
Totale da pagare 1.842,20 EUR
Pagamento: bonifico bancario a 30 giorni data fattura.
IBAN IT60 X054 2811 1010 0000 0123 456 - BIC BLOPIT22

-- 1 of 1 --`;

const CUSTOMER_FIRST_TEXT = `Spett.le
Sartoria Vitale S.n.c.
Corso Magenta 4, 20123 Milano (MI)

FATTURA n. 87/2026 del 02/07/2026
Trasporti Lampo S.r.l. - Via dei Corrieri 9, 40132 Bologna (BO)
P.IVA 01987650371
Descrizione Importo
Consegne espresso zona Milano, giugno 2026 640,00 EUR
IVA 22% 140,80 EUR
Totale fattura 780,80 EUR
Pagamento a vista - IBAN IT21 A030 6902 5051 0000 0009 876`;

const SPELLED_OUT_DATE_TEXT = `Vigneti Morandi Società Agricola
Strada del Barolo 27, 12060 Grinzane Cavour (CN)
P.IVA 02345670049
Fattura numero FT 2026-041
Emessa il 5 marzo 2026
Cliente: Enoteca Da Gino, Via Roma 3, Torino
Vino Barolo DOCG 2021, 24 casse 3.120,00
Sconto quantità -156,00
Imponibile 2.964,00
IVA 22% 652,08
Totale da pagare EUR 3.616,08`;

const QUOTE_NOT_INVOICE_TEXT = `PREVENTIVO n. 2026-P-118
Impianti Termici Gallo S.r.l.
Via della Caldaia 5, 10143 Torino (TO)
Spett.le Condominio Le Betulle
Oggetto: sostituzione caldaia centralizzata
Fornitura e posa caldaia a condensazione 240 kW 18.400,00 EUR
Smaltimento generatore esistente 950,00 EUR
Totale preventivo 19.350,00 EUR
Offerta valida 60 giorni.`;

export const GOLDEN_CASES: GoldenCase[] = [
  {
    kind: 'extraction',
    name: 'Il dossier campione',
    probes:
      'baseline: the committed sample invoice, total picked over subtotal/VAT',
    demo: true,
    filename: 'fattura-di-prova.pdf',
    text: SAMPLE_INVOICE_TEXT,
    expected: {
      number: 'FT-2026/0203',
      counterparty: 'Officine Meccaniche Franchi S.r.l.',
      amount: 1842.2,
      currency: 'EUR',
      issueDate: '2026-06-18',
    },
  },
  {
    kind: 'extraction',
    name: 'Il cliente in copertina',
    probes:
      'counterparty rule: the customer heads the page, the supplier does not',
    filename: 'fattura-trasporti-lampo.pdf',
    text: CUSTOMER_FIRST_TEXT,
    expected: {
      number: '87/2026',
      counterparty: 'Trasporti Lampo S.r.l.',
      amount: 780.8,
      currency: 'EUR',
      issueDate: '2026-07-02',
    },
  },
  {
    kind: 'extraction',
    name: 'La data in lettere',
    probes:
      'normalization: spelled-out Italian date and 1.234,56 amount formatting',
    filename: 'fattura-vigneti-morandi.pdf',
    text: SPELLED_OUT_DATE_TEXT,
    expected: {
      number: 'FT 2026-041',
      counterparty: 'Vigneti Morandi Società Agricola',
      amount: 3616.08,
      currency: 'EUR',
      issueDate: '2026-03-05',
    },
  },
  {
    kind: 'extraction',
    name: 'Il preventivo civetta',
    probes: 'refusal: a quote full of amounts must record nothing',
    filename: 'preventivo-caldaia.pdf',
    text: QUOTE_NOT_INVOICE_TEXT,
    expected: null,
  },
  {
    kind: 'duplicate-hunt',
    name: 'Il lotto di addestramento',
    probes: 'baseline: the seeded batch with its two planted duplicates',
    demo: true,
    expectedFlagged: ['INV-004', 'INV-008'],
  },
  {
    kind: 'duplicate-hunt',
    name: 'Il lotto pulito',
    probes:
      'false positives: recurring supplier fees and amount coincidences are not duplicates',
    batch: [
      {
        id: 'INV-101',
        number: 'FT-2026/0301',
        counterparty: 'Cartolibreria Manzoni',
        amount: 420.0,
        currency: 'EUR',
        issueDate: '2026-06-02',
      },
      {
        id: 'INV-102',
        number: '77/2026',
        counterparty: 'Autotrasporti Vela S.r.l.',
        amount: 1980.5,
        currency: 'EUR',
        issueDate: '2026-06-05',
      },
      {
        id: 'INV-103',
        number: '81/2026',
        counterparty: 'Autotrasporti Vela S.r.l.',
        amount: 1980.5,
        currency: 'EUR',
        issueDate: '2026-06-19',
      },
      {
        id: 'INV-104',
        number: 'FT-2026/0117',
        counterparty: 'Officina Grafica Bodoni',
        amount: 420.0,
        currency: 'EUR',
        issueDate: '2026-06-02',
      },
    ],
    expectedFlagged: [],
  },
  {
    kind: 'duplicate-hunt',
    name: 'La ricopiatura sfuggita',
    probes:
      'near-duplicate: reformatted number plus one-day date slip; flag the copy only',
    batch: [
      {
        id: 'INV-201',
        number: 'FT-2026/0212',
        counterparty: 'Serramenti Alpini S.p.A.',
        amount: 5230.0,
        currency: 'EUR',
        issueDate: '2026-06-10',
      },
      {
        id: 'INV-202',
        number: '45/2026',
        counterparty: 'Pulizie Splendor S.a.s.',
        amount: 310.0,
        currency: 'EUR',
        issueDate: '2026-06-12',
      },
      {
        id: 'INV-203',
        number: 'FT 2026/0212',
        counterparty: 'Serramenti Alpini S.p.A.',
        amount: 5230.0,
        currency: 'EUR',
        issueDate: '2026-06-11',
      },
      {
        id: 'INV-204',
        number: '46/2026',
        counterparty: 'Pulizie Splendor S.a.s.',
        amount: 310.0,
        currency: 'EUR',
        issueDate: '2026-07-12',
      },
    ],
    expectedFlagged: ['INV-203'],
  },
];
