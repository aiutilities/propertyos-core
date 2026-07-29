import {
  Injectable,
} from '@nestjs/common';

import {
  PaymentReconciliationStateUpdater,
  UpdateLocalPaymentFromProviderInput,
} from '@forgeos/payment';

import {
  PaymentTransactionRepository,
} from '../../repositories';

@Injectable()
export class PropertyOSPaymentReconciliationStateUpdaterAdapter
  implements PaymentReconciliationStateUpdater
{
  constructor(
    private readonly repository:
      PaymentTransactionRepository,
  ) {}

  async updateLocalPayment(
    input:
      UpdateLocalPaymentFromProviderInput,
  ): Promise<void> {
    const updated =
      await this.repository
        .updateState({
          paymentId:
            input.local.paymentId,

          status:
            input.provider.status,

          providerName:
            input.provider
              .providerName,

          providerOrderId:
            input.provider
              .providerOrderId,

          providerPaymentId:
            input.provider
              .providerPaymentId,

          money:
            input.provider.money,

          metadata: {
            reconciliationRunId:
              input
                .reconciliationRunId,

            reconciledAt:
              new Date()
                .toISOString(),

            reconciliationSource:
              'provider',
          },
        });

    if (!updated) {
      throw new Error(
        `PAYMENT_RECONCILIATION_TRANSACTION_NOT_FOUND: ${input.local.paymentId}`,
      );
    }
  }
}
