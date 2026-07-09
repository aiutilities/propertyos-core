export interface RentLedger {
  id: string;
  tenantId: string;
  agreementId: string;
  periodYear: number;
  periodMonth: number;
  dueDate: string;
  rentAmount: number;
  amountPaid: number;
  balanceAmount: number;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RentLedgerListResponse {
  success: boolean;
  data: {
    items: RentLedger[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
