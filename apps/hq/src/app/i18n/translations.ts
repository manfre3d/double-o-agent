export type Lang = 'en' | 'it';

const en = {
  // Header / masthead chrome
  subtitle: 'HQ, live link to Control',
  tagline:
    `Everyone's building AI agents right now. This one is of the secret kind! \nDouble-O Agent is a demo where an AI runs the least glamorous missions in small-business finance, hunting duplicate invoices and reading the details off invoice PDFs, streaming every move to this dashboard as it works.`,
  audioOn: 'Audio: on',
  audioOff: 'Audio: off',
  langLabelPrefix: 'Language',
  switchLanguage: 'Switch language',
  modeLabelPrefix: 'Mode',
  modeLive: 'Live',
  modeDemo: 'Demo',
  modeToggleLabel: 'Switch between live and demo missions',

  // Control status
  controlStatusTitle: 'Control status',
  controlStatusError: 'No response from Control.',
  controlStatusLoading: 'Contacting Control',

  // Live mission section
  liveMissionTitle: 'Live mission',
  missionIntro:
    `Two demo missions. Launch one and watch the agent work in real time, one step at a time.`,
  demoTag: 'Demo',
  liveTag: 'Live',
  missionHuntTitle: 'Hunt for duplicate invoices',
  missionHuntDesc:
    `The agent scans a ready-made set of 10 sample invoices and flags the ones entered twice. Nothing to set up. Just press start.`,
  missionDossierTitle: 'Read your own invoice',
  missionDossierDesc:
    `Upload an invoice PDF. The agent reads it and pulls out the supplier, number, amount, and date.`,
  startMission: 'Start mission',
  missionRunning: 'Mission running…',
  submitDossier: 'Submit dossier (PDF)',
  preparingMission: 'Establishing secure link',
  preparingDossier: 'Decrypting the dossier',
  transmissionInterrupted: 'Transmission interrupted',

  // MissionService link errors
  errStartMission: 'Could not reach Control.',
  errDossierRejected: 'Dossier rejected: needs a PDF with readable text.',
  errLinkInterrupted: 'Link to Control interrupted.',

  // Footer
  footer:
    `Double-O Agent is satire, a 007 parody where the spy is a language model and the villain is an overdue invoice. Not affiliated with, or endorsed by, the James Bond franchise or its rights holders.`,

  // Intro
  skipHint: 'Click to skip',

  // Mission feed / debrief
  missionNo: 'Mission no. {n}',
  topSecret: 'Top secret',
  missionReport: 'Mission report',
  invoiceNo: 'Invoice no.',
  invoiceLabel: 'Invoice',
  vendor: 'Vendor',
  amount: 'Amount',
  issuedOn: 'Issued on',

  // Gadget transmission
  fieldNumber: 'Number',
  fieldVendor: 'Vendor',
  fieldAmount: 'Amount',
  fieldDate: 'Date',
  moreEntries: '… and {n} more entries',
  rawData: 'Raw data',

  // Gadget step labels
  gadgetListInvoices: 'Listing the invoices',
  gadgetCompareInvoices: 'Comparing two invoices',
  gadgetFlagInvoice: 'Flagging a duplicate',
  gadgetReadDocument: 'Reading the document',
  gadgetRecordInvoice: 'Recording the invoice',

  // Analytics
  analyticsTitle: 'Operational analytics',
  analyticsError: 'Analytics unavailable.',
  noData: 'No data',
  archiveEmptyAnalytics: 'Archive empty: nothing to analyze.',
  totalMissions: 'Total missions',
  successRate: 'Success rate',
  avgDuration: 'Average duration',
  flaggedInvoices: 'Flagged invoices',
  missionsByType: 'Missions by type',
  completed: 'Completed',
  failed: 'Failed',
  running: 'Running',
  gadgetUsage: 'Gadget usage',
  failureSingular: 'failure',
  failurePlural: 'failures',
  noGadgetsUsed: 'No gadgets used yet.',
  processingData: 'Processing data',

  // Archive / history
  archiveTitle: 'Mission archive',
  archiveError: 'Archive unavailable.',
  archiveEmpty: 'Archive empty',
  noMissionsInArchive: 'No missions in archive.',
  statusLine: 'Status: {status}',
  transcript: 'Transcript',
  retrievingDossier: 'Retrieving dossier',
  retrievingArchive: 'Retrieving archive',
  statusRunning: 'RUNNING',
  statusCompleted: 'COMPLETED',
  statusFailed: 'FAILED',
  stampRunning: 'In progress',
  stampFailed: 'Failed',
} satisfies Record<string, string>;

export type TranslationKey = keyof typeof en;

const it: Record<TranslationKey, string> = {
  subtitle: 'HQ, collegamento in diretta con Control',
  tagline:
    `Tutti parlano di agenti IA, questo è di quelli segreti! \nDouble-O Agent è una demo in cui un'IA svolge le missioni meno glamour della contabilità delle piccole imprese, dà la caccia alle fatture doppie e legge i dati dalle fatture in PDF, trasmettendo ogni mossa a questo cruscotto mentre lavora.`,
  audioOn: 'Audio: attivo',
  audioOff: 'Audio: silenziato',
  langLabelPrefix: 'Lingua',
  switchLanguage: 'Cambia lingua',
  modeLabelPrefix: 'Modalità',
  modeLive: 'Dal vivo',
  modeDemo: 'Demo',
  modeToggleLabel: 'Alterna missioni dal vivo e dimostrative',

  controlStatusTitle: 'Stato Control',
  controlStatusError: 'Nessuna risposta da Control.',
  controlStatusLoading: 'In contatto con Control',

  liveMissionTitle: 'Missione in diretta',
  missionIntro:
    `Due missioni dimostrative. Avviane una e osserva l'agente lavorare in tempo reale, un passo alla volta.`,
  demoTag: 'Demo',
  liveTag: 'Dal vivo',
  missionHuntTitle: 'Caccia alle fatture doppie',
  missionHuntDesc:
    `L'agente esamina una serie pronta di 10 fatture di esempio e segnala quelle inserite due volte. Niente da preparare: basta premere avvia.`,
  missionDossierTitle: 'Leggi la tua fattura',
  missionDossierDesc:
    `Carica una fattura in PDF. L'agente la legge ed estrae fornitore, numero, importo e data.`,
  startMission: 'Avvia missione',
  missionRunning: 'Missione in corso…',
  submitDossier: 'Consegna dossier (PDF)',
  preparingMission: 'Collegamento sicuro in corso',
  preparingDossier: 'Decrittazione del dossier',
  transmissionInterrupted: 'Trasmissione interrotta',

  errStartMission: 'Impossibile contattare Control.',
  errDossierRejected: 'Dossier respinto: serve un PDF con testo leggibile.',
  errLinkInterrupted: 'Collegamento con Control interrotto.',

  footer:
    `Double-O Agent è satira, una parodia di 007 in cui la spia è un modello linguistico e il cattivo è una fattura scaduta. Non affiliato con, né approvato da, il franchise di James Bond o dai suoi aventi diritto.`,

  skipHint: 'Clicca per saltare',

  missionNo: 'Missione n. {n}',
  topSecret: 'Top secret',
  missionReport: 'Rapporto di missione',
  invoiceNo: 'Fattura n.',
  invoiceLabel: 'Fattura',
  vendor: 'Fornitore',
  amount: 'Importo',
  issuedOn: 'Emessa il',

  fieldNumber: 'Numero',
  fieldVendor: 'Fornitore',
  fieldAmount: 'Importo',
  fieldDate: 'Data',
  moreEntries: '… e altre {n} voci',
  rawData: 'Dati grezzi',

  gadgetListInvoices: 'Elenco delle fatture',
  gadgetCompareInvoices: 'Confronto tra due fatture',
  gadgetFlagInvoice: 'Segnalazione di un doppione',
  gadgetReadDocument: 'Lettura del documento',
  gadgetRecordInvoice: 'Registrazione della fattura',

  analyticsTitle: 'Analisi operativa',
  analyticsError: 'Analisi non disponibile.',
  noData: 'Nessun dato',
  archiveEmptyAnalytics: 'Archivio vuoto: nessun dato da analizzare.',
  totalMissions: 'Missioni totali',
  successRate: 'Tasso di successo',
  avgDuration: 'Durata media',
  flaggedInvoices: 'Fatture segnalate',
  missionsByType: 'Missioni per tipo',
  completed: 'Completate',
  failed: 'Fallite',
  running: 'In corso',
  gadgetUsage: 'Impiego dei gadget',
  failureSingular: 'guasto',
  failurePlural: 'guasti',
  noGadgetsUsed: 'Nessun gadget impiegato finora.',
  processingData: 'Elaborazione dei dati',

  archiveTitle: 'Archivio missioni',
  archiveError: 'Archivio non disponibile.',
  archiveEmpty: 'Archivio vuoto',
  noMissionsInArchive: 'Nessuna missione in archivio.',
  statusLine: 'Stato: {status}',
  transcript: 'Trascrizione',
  retrievingDossier: 'Recupero del dossier',
  retrievingArchive: `Recupero dell'archivio`,
  statusRunning: 'IN CORSO',
  statusCompleted: 'COMPLETATA',
  statusFailed: 'FALLITA',
  stampRunning: 'In corso',
  stampFailed: 'Fallita',
};

export const translations: Record<Lang, Record<TranslationKey, string>> = { en, it };
