export interface RentPayment {
  id: string;
  rentLedgerId: string;
  paymentDate: string;
  amount: number;
  paymentMode: string;
  referenceNumber?: string;
  notes?: string;
  createdAt: string;
}
