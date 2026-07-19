import { Injectable } from '@nestjs/common';
import type { InvoiceDto } from '@double-o/shared';

/**
 * Seeded demo batch for Phase 2; replaced by Postgres in Phase 3.
 * Planted anomalies: INV-004 duplicates INV-002 (same number entered twice)
 * and INV-008 near-duplicates INV-006 (same supplier/amount, number typo).
 */
export const SEED_INVOICES: InvoiceDto[] = [
  {
    id: 'INV-001',
    number: 'FT-2026/0087',
    counterparty: 'Cartiera Fabriano S.r.l.',
    amount: 1240.5,
    currency: 'EUR',
    issueDate: '2026-05-04',
  },
  {
    id: 'INV-002',
    number: '114/2026',
    counterparty: 'Elettroforniture Bianchi S.p.A.',
    amount: 3480.0,
    currency: 'EUR',
    issueDate: '2026-05-11',
  },
  {
    id: 'INV-003',
    number: 'FT-2026/0102',
    counterparty: 'Tipografia Colombo & Figli',
    amount: 862.4,
    currency: 'EUR',
    issueDate: '2026-05-15',
  },
  {
    id: 'INV-004',
    number: '114/2026',
    counterparty: 'Elettroforniture Bianchi S.p.A.',
    amount: 3480.0,
    currency: 'EUR',
    issueDate: '2026-05-11',
  },
  {
    id: 'INV-005',
    number: 'PA-2026-33',
    counterparty: 'Autonoleggio Sprint S.r.l.',
    amount: 540.0,
    currency: 'EUR',
    issueDate: '2026-05-18',
  },
  {
    id: 'INV-006',
    number: 'FT 2026/0159',
    counterparty: 'Molini Rossetti S.p.A.',
    amount: 2190.75,
    currency: 'EUR',
    issueDate: '2026-05-22',
  },
  {
    id: 'INV-007',
    number: '2026-071',
    counterparty: 'Studio Ferrari Consulenze',
    amount: 1500.0,
    currency: 'EUR',
    issueDate: '2026-05-25',
  },
  {
    id: 'INV-008',
    number: 'FT-2026/0159',
    counterparty: 'Molini Rossetti S.p.A.',
    amount: 2190.75,
    currency: 'EUR',
    issueDate: '2026-05-23',
  },
  {
    id: 'INV-009',
    number: 'FT-2026/0121',
    counterparty: 'Cartiera Fabriano S.r.l.',
    amount: 640.0,
    currency: 'EUR',
    issueDate: '2026-06-01',
  },
  {
    id: 'INV-010',
    number: '128/2026',
    counterparty: 'Elettroforniture Bianchi S.p.A.',
    amount: 912.3,
    currency: 'EUR',
    issueDate: '2026-06-05',
  },
];

@Injectable()
export class InvoicesRepository {
  findAll(): InvoiceDto[] {
    return SEED_INVOICES;
  }

  findById(id: string): InvoiceDto | undefined {
    return SEED_INVOICES.find((invoice) => invoice.id === id);
  }
}
