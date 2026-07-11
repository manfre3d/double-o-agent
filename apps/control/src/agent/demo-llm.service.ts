import { Injectable } from '@nestjs/common';
import type { AssistantTurn, ChatMessage } from './agent.types';
import { LlmService } from './llm.service';

/**
 * Scripted brain for demo mode (no OpenAI key needed). Replays a fixed
 * duplicate hunt over the seeded batch. Stateless across missions: the
 * current step is derived from how many assistant turns are already in
 * the conversation, so concurrent missions never share state.
 */
@Injectable()
export class DemoLlmService extends LlmService {
  /** Delay between turns so the feed streams at a believable pace. */
  constructor(private readonly turnDelayMs = 600) {
    super();
  }

  async chat(messages: ChatMessage[]): Promise<AssistantTurn> {
    const step = messages.filter((m) => m.role === 'assistant').length;
    await pause(this.turnDelayMs);
    return SCRIPT[Math.min(step, SCRIPT.length - 1)];
  }
}

const SCRIPT: AssistantTurn[] = [
  {
    text: 'Esercitazione di addestramento — nessun collegamento con il quartier generale LLM. Procedo comunque secondo protocollo: esamino il lotto.',
    toolCalls: [{ id: 'demo-1', name: 'list_invoices', args: {} }],
  },
  {
    text: 'Due coppie sospette: la fattura 114/2026 di Elettroforniture Bianchi compare due volte, e le fatture di Molini Rossetti hanno numeri quasi identici. Verifico la prima coppia.',
    toolCalls: [
      {
        id: 'demo-2',
        name: 'compare_invoices',
        args: { invoiceIdA: 'INV-002', invoiceIdB: 'INV-004' },
      },
    ],
  },
  {
    text: 'Corrispondenza totale: stesso numero, stesso fornitore, stesso importo, stessa data. Ora la seconda coppia.',
    toolCalls: [
      {
        id: 'demo-3',
        name: 'compare_invoices',
        args: { invoiceIdA: 'INV-006', invoiceIdB: 'INV-008' },
      },
    ],
  },
  {
    text: 'Stesso numero scritto in due modi, stesso fornitore, stesso importo, un giorno di scarto: doppia registrazione. Segnalo entrambe le copie ridondanti.',
    toolCalls: [
      {
        id: 'demo-4',
        name: 'flag_invoice',
        args: {
          invoiceId: 'INV-004',
          reason:
            'Doppione esatto della fattura 114/2026 di Elettroforniture Bianchi (INV-002).',
        },
      },
      {
        id: 'demo-5',
        name: 'flag_invoice',
        args: {
          invoiceId: 'INV-008',
          reason:
            'Doppia registrazione della fattura FT 2026/0159 di Molini Rossetti (INV-006), numero riformattato e data slittata di un giorno.',
        },
      },
    ],
  },
  {
    text: 'Rapporto di missione: lotto di 10 fatture esaminato. Individuati e segnalati 2 doppioni — INV-004 (copia esatta di INV-002) e INV-008 (ricopiatura di INV-006 con numero riformattato). Nessun’altra anomalia degna di nota. S.P.E.T.T.R.O. contenuto, per ora.',
    toolCalls: [],
  },
];

function pause(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
