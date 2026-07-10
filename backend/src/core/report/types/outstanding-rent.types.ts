export interface OutstandingRentRow {
  rentLedgerId: string;
  propertyId: string;
  propertyName: string;
  tenantId: string;
  tenantNumber: string;
  tenantName: string;
  agreementId: string;
  agreementNumber: string;
  periodYear: number;
  periodMonth: number;
  dueDate: string;
  rentAmount: number;
  amountPaid: number;
  balanceAmount: number;
  status: string;
  overdueDays: number;
}

export interface OutstandingRentSummary {
  totalRentBilled: number;
  totalAmountPaid: number;
  totalOutstanding: number;
  ledgerCount: number;
  overdueLedgerCount: number;
}

export interface OutstandingRentReport {
  items: OutstandingRentRow[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  summary: OutstandingRentSummary;
}
