import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';

import { EventBusService } from '../../eventbus/services/eventbus.service';
import {
  PaginatedResponseDto,
  PaginationQueryDto,
} from '../../platform';
import { RentPayment } from '../types/payment.types';
import { RentLedger, RentStatus } from '../types/rent.types';
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
    private readonly eventBusService: EventBusService,
  ) {}

  async createRentLedger(input: {
    tenantId: string;
    agreementId: string;
    periodYear: number;
    periodMonth: number;
    dueDate: string;
    rentAmount: number;
  }): Promise<RentLedger> {
    const now = new Date().toISOString();

    const ledger = await this.rentRepository.createRentLedger({
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

    await this.eventBusService.publish(
      'NOTIFICATION_REQUESTED',
      'rent.service',
      {
        channel: 'IN_APP',
        recipient: 'OWNER',
        subject: 'Rent ledger created',
        message: `Rent ledger created for ${ledger.periodMonth}/${ledger.periodYear}`,
        metadata: {
          domainEventType: 'RENT_LEDGER_CREATED',
          rentLedgerId: ledger.id,
          tenantId: ledger.tenantId,
          agreementId: ledger.agreementId,
          rentAmount: ledger.rentAmount,
          dueDate: ledger.dueDate,
        },
      },
    );

    return ledger;
  }

  listRentLedgers(): Promise<RentLedger[]> {
    return this.rentRepository.listRentLedgers();
  }

  listRentLedgersPaginated(
    query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<RentLedger>> {
    return this.rentRepository.listRentLedgersPaginated(query);
  }

  getRentLedger(id: string): Promise<RentLedger | undefined> {
    return this.rentRepository.getRentLedger(id);
  }

  async postPayment(
    rentLedgerId: string,
    input: {
      paymentDate: string;
      amount: number;
      paymentMode: string;
      referenceNumber?: string;
      notes?: string;
    },
  ): Promise<{
    payment: RentPayment;
    ledger: RentLedger;
  }> {
    const ledger = await this.rentRepository.getRentLedger(rentLedgerId);

    if (!ledger) {
      throw new NotFoundException('Rent ledger not found');
    }

    const payment = await this.rentRepository.createPayment({
      id: randomUUID(),
      rentLedgerId,
      paymentDate: input.paymentDate,
      amount: input.amount,
      paymentMode: input.paymentMode,
      referenceNumber: input.referenceNumber,
      notes: input.notes,
      createdAt: new Date().toISOString(),
    });

    const amountPaid = ledger.amountPaid + input.amount;
    const balanceAmount = Math.max(ledger.rentAmount - amountPaid, 0);
    const status = this.calculateStatus(amountPaid, ledger.rentAmount);

    await this.rentRepository.updateLedgerAmounts(
      rentLedgerId,
      amountPaid,
      balanceAmount,
      status,
    );

    const updatedLedger = await this.rentRepository.getRentLedger(rentLedgerId);

    if (!updatedLedger) {
      throw new NotFoundException('Updated rent ledger not found');
    }

    await this.eventBusService.publish(
      'NOTIFICATION_REQUESTED',
      'rent.service',
      {
        channel: 'IN_APP',
        recipient: 'OWNER',
        subject: 'Rent payment posted',
        message: `Rent payment posted: ${input.amount}`,
        metadata: {
          domainEventType: 'RENT_PAYMENT_POSTED',
          rentLedgerId,
          paymentId: payment.id,
          tenantId: updatedLedger.tenantId,
          amount: input.amount,
          amountPaid: updatedLedger.amountPaid,
          balanceAmount: updatedLedger.balanceAmount,
          status: updatedLedger.status,
        },
      },
    );

    return {
      payment,
      ledger: updatedLedger,
    };
  }

  listPayments(rentLedgerId: string): Promise<RentPayment[]> {
    return this.rentRepository.listPayments(rentLedgerId);
  }

  private calculateStatus(
    amountPaid: number,
    rentAmount: number,
  ): RentStatus {
    if (amountPaid <= 0) {
      return 'UNPAID';
    }

    if (amountPaid < rentAmount) {
      return 'PARTIAL';
    }

    return 'PAID';
  }
}
