export type Lang = 'en' | 'it';

const en = {
  // Header / masthead chrome
  subtitle: 'HQ — live link to Control',
  tagline:
    'The secret agent here is an AI. It runs small-business finance missions ' +
    '— extracting invoices, hunting duplicates, reconciling records — and ' +
    'streams every move to this dashboard, live.',
  audioOn: 'Audio: on',
  audioOff: 'Audio: off',
  langLabelPrefix: 'Language',
  switchLanguage: 'Switch language',

  // Control status
  controlStatusTitle: 'Control status',
  controlStatusError: 'No response from Control.',
  controlStatusLoading: 'Contacting Control',

  // Live mission section
  liveMissionTitle: 'Live mission',
  startMission: 'Start mission',
  missionRunning: 'Mission running…',
  submitDossier: 'Submit dossier (PDF)',
  transmissionInterrupted: 'Transmission interrupted',

  // MissionService link errors
  errStartMission: 'Could not reach Control.',
  errDossierRejected: 'Dossier rejected: needs a PDF with readable text.',
  errLinkInterrupted: 'Link to Control interrupted.',

  // Footer
  footer:
    'Double-O Agent is satire — a 007 parody where the spy is a language ' +
    'model and the villain is an overdue invoice. Not affiliated with, or ' +
    'endorsed by, the James Bond franchise or its rights holders.',

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
  subtitle: 'HQ — collegamento in diretta con Control',
  tagline:
    "L'agente segreto qui è un'intelligenza artificiale. Conduce missioni di " +
    'finanza per piccole imprese — estrazione fatture, caccia ai doppioni, ' +
    'riconciliazione — e trasmette ogni mossa a questo cruscotto, in diretta.',
  audioOn: 'Audio: attivo',
  audioOff: 'Audio: silenziato',
  langLabelPrefix: 'Lingua',
  switchLanguage: 'Cambia lingua',

  controlStatusTitle: 'Stato Control',
  controlStatusError: 'Nessuna risposta da Control.',
  controlStatusLoading: 'In contatto con Control',

  liveMissionTitle: 'Missione in diretta',
  startMission: 'Avvia missione',
  missionRunning: 'Missione in corso…',
  submitDossier: 'Consegna dossier (PDF)',
  transmissionInterrupted: 'Trasmissione interrotta',

  errStartMission: 'Impossibile contattare Control.',
  errDossierRejected: 'Dossier respinto: serve un PDF con testo leggibile.',
  errLinkInterrupted: 'Collegamento con Control interrotto.',

  footer:
    'Double-O Agent è satira — una parodia di 007 in cui la spia è un ' +
    'modello linguistico e il cattivo è una fattura scaduta. Non affiliato ' +
    'con, né approvato da, il franchise di James Bond o dai suoi aventi diritto.',

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
  retrievingArchive: "Recupero dell'archivio",
  statusRunning: 'IN CORSO',
  statusCompleted: 'COMPLETATA',
  statusFailed: 'FALLITA',
  stampRunning: 'In corso',
  stampFailed: 'Fallita',
};

export const translations: Record<Lang, Record<TranslationKey, string>> = { en, it };
