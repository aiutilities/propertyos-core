import {
  Injectable,
} from '@nestjs/common';

import {
  PaymentStateStore,
  StoredPaymentState,
  UpdatePaymentStateInput,
} from '@forgeos/payment';

import {
  PaymentTransactionRepository,
} from '../../repositories';

@Injectable()
export class PropertyOSPaymentStateStoreAdapter
  implements PaymentStateStore
{
  constructor(
    private readonly repository:
      PaymentTransactionRepository,
  ) {}

  async updatePaymentState(
    input:
      UpdatePaymentStateInput,
  ): Promise<StoredPaymentState> {
    const transaction =
      await this.repository
        .updateState(input);

    if (!transaction) {
      throw new Error(
        `PAYMENT_TRANSACTION_NOT_FOUND: ${input.paymentId}`,
      );
    }

    return {
      id:
        transaction.id,

      status:
        transaction.status,

      providerName:
        transaction.providerName,

      providerOrderId:
        transaction.providerOrderId,

      providerPaymentId:
        transaction.providerPaymentId,

      providerRefundId:
        transaction.providerRefundId,

      money:
        transaction.money,

      metadata:
        transaction.metadata,
    };
  }
}
