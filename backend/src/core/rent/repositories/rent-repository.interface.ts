import { RentLedger } from '../types/rent.types';
import { RentPayment } from '../types/payment.types';

export const RENT_REPOSITORY = 'RENT_REPOSITORY';

export interface RentRepositoryPort {
  createRentLedger(
    ledger: RentLedger,
  ): Promise<RentLedger>;

  listRentLedgers(): Promise<RentLedger[]>;

  getRentLedger(
    id: string,
  ): Promise<RentLedger | undefined>;

  createPayment(
    payment: RentPayment,
  ): Promise<RentPayment>;

  listPayments(
    rentLedgerId: string,
  ): Promise<RentPayment[]>;

  updateLedgerAmounts(
    ledgerId: string,
    amountPaid: number,
    balanceAmount: number,
    status: string,
  ): Promise<void>;
}
