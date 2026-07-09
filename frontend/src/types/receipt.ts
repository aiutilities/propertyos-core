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
