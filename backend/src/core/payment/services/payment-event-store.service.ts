import {
  Injectable,
} from '@nestjs/common';

import {
  AppendPaymentEventInput,
} from '../contracts';

import {
  PaymentProviderEvent,
} from '../entities';

import {
  PaymentProviderEventRepository,
} from '../repositories';

@Injectable()
export class PaymentEventStoreService {
  constructor(
    private readonly repository:
      PaymentProviderEventRepository,
  ) {}

  async append(
    input:
      AppendPaymentEventInput,
  ): Promise<
    PaymentProviderEvent
  > {
    const existing =
      await this.repository
        .findByProviderEventId(
          input.providerName,
          input.providerEventId,
        );

    if (existing) {
      return existing;
    }

    const receivedAt =
      input.receivedAt ??
      new Date();

    return this.repository.create({
      id:
        input.id,

      paymentId:
        input.paymentId,

      providerName:
        input.providerName,

      providerEventId:
        input.providerEventId,

      eventType:
        input.eventType,

      providerOrderId:
        input.providerOrderId,

      providerPaymentId:
        input.providerPaymentId,

      providerRefundId:
        input.providerRefundId,

      payload:
        input.payload ?? {},

      metadata:
        input.metadata ?? {},

      occurredAt:
        input.occurredAt,

      receivedAt,

      createdAt:
        receivedAt,
    });
  }

  async timeline(
    paymentId:
      string,
  ): Promise<
    readonly PaymentProviderEvent[]
  > {
    return this.repository
      .listByPaymentId(
        paymentId,
      );
  }
}
