import { InvoiceStatus } from '../types';

export interface CreateInvoiceDto {
  tenantId: string;
  agreementId?: string;
  rentLedgerId?: string;
  receiptId?: string;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  invoiceDate: string;
  dueDate: string;
  amount: number;
  status?: InvoiceStatus;
}
