export type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  tenantId: string;
  agreementId?: string | null;
  rentLedgerId?: string | null;
  receiptId?: string | null;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  invoiceDate: string;
  dueDate: string;
  amount: number;
  status: InvoiceStatus;
  createdAt: Date;
  updatedAt: Date;
}
