export interface RentCollectionRow {
  paymentId: string;
  rentLedgerId: string;
  tenantId: string;
  tenantNumber: string;
  tenantName: string;
  propertyId: string;
  propertyName: string;
  agreementId: string;
  agreementNumber: string;
  receiptId?: string;
  receiptNumber?: string;
  paymentDate: string;
  amount: number;
  paymentMode: string;
  referenceNumber?: string;
  notes?: string;
}

export interface RentCollectionSummary {
  totalCollected: number;
  paymentCount: number;
}

export interface RentCollectionReport {
  items: RentCollectionRow[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  summary: RentCollectionSummary;
}
