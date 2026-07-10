export interface Receipt {
  id: string;
  receiptNumber: string;
  rentPaymentId: string;
  rentLedgerId: string;
  tenantId: string;
  amount: number;
  receiptDate: string;
  paymentMode: string;
  referenceNumber?: string | null;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ReceiptListResponse {
  success: boolean;
  data: {
    items: Receipt[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
