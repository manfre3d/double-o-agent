import { Module } from '@nestjs/common';
import { InvoicesRepository } from './invoices.repository';
import { ListInvoicesGadget } from './list-invoices.gadget';
import { CompareInvoicesGadget } from './compare-invoices.gadget';
import { FlagInvoiceGadget } from './flag-invoice.gadget';
import { ReadDocumentGadget } from './read-document.gadget';
import { RecordInvoiceGadget } from './record-invoice.gadget';
import { GadgetRegistry } from './gadget.registry';

@Module({
  providers: [
    InvoicesRepository,
    ListInvoicesGadget,
    CompareInvoicesGadget,
    FlagInvoiceGadget,
    ReadDocumentGadget,
    RecordInvoiceGadget,
    GadgetRegistry,
  ],
  exports: [GadgetRegistry],
})
export class GadgetsModule {}
