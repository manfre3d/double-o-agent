import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import type { StoredInvoiceDto } from '@double-o/shared';
import { LanguageService } from '../language.service';
import { MissionService } from './mission.service';
import { formatInvoiceAmount } from './format-amount';

/** The session's uploaded invoice batch (live mode). Fed by the parent's
 *  /api/invoices resource so the hunt button and this list share one fetch. */
@Component({
  selector: 'app-invoice-batch',
  imports: [DatePipe],
  templateUrl: './invoice-batch.html',
  styleUrl: './invoice-batch.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvoiceBatch {
  readonly invoices = input<StoredInvoiceDto[] | undefined>(undefined);
  readonly loading = input(false);
  readonly failed = input(false);

  protected readonly mission = inject(MissionService);
  protected readonly language = inject(LanguageService);
  protected readonly amount = formatInvoiceAmount;

  protected clear(): void {
    this.mission.clearBatch();
  }
}
