export type ReceiptStatus = 'ISSUED' | 'CANCELLED';

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

  status: ReceiptStatus;

  createdAt: Date;
  updatedAt: Date;
}
