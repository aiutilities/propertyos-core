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
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface InvoiceListResponse {
  success: boolean;
  data: {
    items: Invoice[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
