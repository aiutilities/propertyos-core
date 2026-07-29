import {
  ReconciliationLocalPayment,
  ReconciliationProviderPayment,
} from './payment-reconciliation.types';

export interface UpdateLocalPaymentFromProviderInput {
  local:
    ReconciliationLocalPayment;

  provider:
    ReconciliationProviderPayment;

  reconciliationRunId:
    string;
}

export interface PaymentReconciliationStateUpdater {
  updateLocalPayment(
    input:
      UpdateLocalPaymentFromProviderInput,
  ): Promise<void>;
}

export class NoopPaymentReconciliationStateUpdater
  implements PaymentReconciliationStateUpdater
{
  async updateLocalPayment(
    _input:
      UpdateLocalPaymentFromProviderInput,
  ): Promise<void> {
    return;
  }
}
