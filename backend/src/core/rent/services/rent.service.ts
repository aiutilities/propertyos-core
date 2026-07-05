import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

import { RentLedger } from '../types/rent.types';
import {
  RENT_REPOSITORY,
  RentRepositoryPort,
} from '../repositories/rent-repository.interface';

export { RENT_REPOSITORY };

@Injectable()
export class RentService {
  constructor(
    @Inject(RENT_REPOSITORY)
    private readonly rentRepository: RentRepositoryPort,
  ) {}

  createRentLedger(input: {
    tenantId: string;
    agreementId: string;
    periodYear: number;
    periodMonth: number;
    dueDate: string;
    rentAmount: number;
  }): Promise<RentLedger> {
    const now = new Date().toISOString();

    return this.rentRepository.createRentLedger({
      id: randomUUID(),

      tenantId: input.tenantId,
      agreementId: input.agreementId,

      periodYear: input.periodYear,
      periodMonth: input.periodMonth,

      dueDate: input.dueDate,

      rentAmount: input.rentAmount,
      amountPaid: 0,
      balanceAmount: input.rentAmount,

      status: 'UNPAID',

      createdAt: now,
      updatedAt: now,
    });
  }

  listRentLedgers(): Promise<RentLedger[]> {
    return this.rentRepository.listRentLedgers();
  }

  getRentLedger(id: string): Promise<RentLedger | undefined> {
    return this.rentRepository.getRentLedger(id);
  }
}
