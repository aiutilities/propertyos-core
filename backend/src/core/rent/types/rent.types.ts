export type RentStatus =
  | 'UNPAID'
  | 'PARTIAL'
  | 'PAID';

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

  status: RentStatus;

  createdAt: string;
  updatedAt: string;
}
