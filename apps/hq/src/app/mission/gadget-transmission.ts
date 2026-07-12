import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DatePipe, JsonPipe } from '@angular/common';
import type { GadgetCallEvent, GadgetResultEvent } from '@double-o/shared';
import { LanguageService } from '../language.service';
import type { TranslationKey } from '../i18n/translations';
import { TypewriterText } from './typewriter-text';
import { formatInvoiceAmount } from './format-amount';
import {
  type InvoiceRecord,
  flatEntries,
  invoiceComparison,
  invoiceList,
  isInvoiceRecord,
  recordedInvoice,
  textPayload,
} from './gadget-payload';

const LEDGER_ROW_CAP = 8;
const TEXT_EXCERPT_CHARS = 280;

/** Translation keys for known invoice fields (ledger header, match report). */
const FIELD_LABEL_KEYS: Record<string, TranslationKey> = {
  number: 'fieldNumber',
  counterparty: 'fieldVendor',
  amount: 'fieldAmount',
  issueDate: 'fieldDate',
};

/** Plain-language labels for gadget ids shown in the feed (raw id kept on hover). */
const GADGET_LABEL_KEYS: Record<string, TranslationKey> = {
  list_invoices: 'gadgetListInvoices',
  compare_invoices: 'gadgetCompareInvoices',
  flag_invoice: 'gadgetFlagInvoice',
  read_document: 'gadgetReadDocument',
  record_invoice: 'gadgetRecordInvoice',
};

interface ResultVm {
  text?: string;
  ledger?: { rows: InvoiceRecord[]; more: number };
  comparison?: { rows: InvoiceRecord[]; matches: { label: string; ok: boolean }[] };
  invoice?: InvoiceRecord;
  entries?: { key: string; value: string }[];
  raw?: true;
}

@Component({
  selector: 'app-gadget-transmission',
  imports: [DatePipe, JsonPipe, TypewriterText],
  templateUrl: './gadget-transmission.html',
  styleUrl: './gadget-transmission.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GadgetTransmission {
  readonly event = input.required<GadgetCallEvent | GadgetResultEvent>();
  /** Skips the typewriter — archived transcripts render fully formed. */
  readonly instant = input(false);

  protected readonly amount = formatInvoiceAmount;
  protected readonly language = inject(LanguageService);

  protected readonly call = computed(() => {
    const event = this.event();
    return event.type === 'gadget_call' ? event : undefined;
  });

  protected readonly result = computed(() => {
    const event = this.event();
    return event.type === 'gadget_result' ? event : undefined;
  });

  protected readonly params = computed(() => {
    const call = this.call();
    return call
      ? Object.entries(call.params).map(([key, value]) => ({
          key,
          value: typeof value === 'string' ? value : JSON.stringify(value),
        }))
      : [];
  });

  private readonly vm = computed<ResultVm | undefined>(() => {
    const result = this.result();
    if (!result?.ok) {
      return undefined;
    }
    const value = result.result;
    const text = textPayload(value);
    if (text !== undefined) {
      return {
        text:
          text.length > TEXT_EXCERPT_CHARS
            ? `${text.slice(0, TEXT_EXCERPT_CHARS)}…`
            : text,
      };
    }
    const list = invoiceList(value);
    if (list) {
      return {
        ledger: {
          rows: list.slice(0, LEDGER_ROW_CAP),
          more: Math.max(0, list.length - LEDGER_ROW_CAP),
        },
      };
    }
    const comparison = invoiceComparison(value);
    if (comparison) {
      return {
        comparison: {
          rows: [comparison.a, comparison.b],
          matches: Object.entries(comparison.matches).map(([field, ok]) => ({
            label: FIELD_LABEL_KEYS[field] ? this.language.t(FIELD_LABEL_KEYS[field]) : field,
            ok,
          })),
        },
      };
    }
    const invoice = recordedInvoice(value) ?? (isInvoiceRecord(value) ? value : undefined);
    if (invoice) {
      return { invoice };
    }
    const entries = flatEntries(value);
    if (entries) {
      return { entries };
    }
    return { raw: true };
  });

  protected readonly text = computed(() => this.vm()?.text);
  protected readonly ledger = computed(() => this.vm()?.ledger);
  protected readonly comparison = computed(() => this.vm()?.comparison);
  protected readonly invoice = computed(() => this.vm()?.invoice);
  protected readonly entries = computed(() => this.vm()?.entries);
  protected readonly raw = computed(() => this.vm()?.raw === true);

  /** Plain-language label for a gadget id; the raw id stays available on hover. */
  protected gadgetLabel(id: string): string {
    const key = GADGET_LABEL_KEYS[id];
    return key ? this.language.t(key) : id;
  }
}
