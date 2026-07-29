import {
  Injectable,
} from '@nestjs/common';

import {
  PaymentReconciliationLocalStore,
  ReconciliationLocalPayment,
  ReconciliationLocalPaymentQuery,
} from '@forgeos/payment';

import {
  PaymentTransactionRepository,
} from '../../repositories';

@Injectable()
export class PropertyOSPaymentReconciliationLocalStoreAdapter
  implements PaymentReconciliationLocalStore
{
  constructor(
    private readonly repository:
      PaymentTransactionRepository,
  ) {}

  async listPayments(
    query:
      ReconciliationLocalPaymentQuery,
  ): Promise<
    readonly ReconciliationLocalPayment[]
  > {
    const transactions =
      await this.repository
        .listForReconciliation(
          query.providerName,

          new Date(
            query.period.start,
          ),

          new Date(
            query.period.end,
          ),
        );

    return transactions.map(
      (transaction) => ({
        paymentId:
          transaction.id,

        providerName:
          transaction.providerName,

        providerOrderId:
          transaction.providerOrderId,

        providerPaymentId:
          transaction.providerPaymentId,

        status:
          transaction.status,

        money:
          transaction.money,

        updatedAt:
          transaction.updatedAt
            .toISOString(),

        metadata:
          transaction.metadata,
      }),
    );
  }
}
