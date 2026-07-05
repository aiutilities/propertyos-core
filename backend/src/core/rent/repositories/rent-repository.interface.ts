import { RentLedger } from '../types/rent.types';

export const RENT_REPOSITORY = 'RENT_REPOSITORY';

export interface RentRepositoryPort {
  createRentLedger(
    ledger: RentLedger,
  ): Promise<RentLedger>;

  listRentLedgers(): Promise<RentLedger[]>;

  getRentLedger(
    id: string,
  ): Promise<RentLedger | undefined>;
}
