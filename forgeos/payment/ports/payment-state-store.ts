import {
  PaymentMoney,
  PaymentStatus,
} from '../contracts';

export interface UpdatePaymentStateInput {
  paymentId: string;

  status:
    PaymentStatus;

  providerName?: string;

  providerOrderId?: string;
  providerPaymentId?: string;
  providerRefundId?: string;

  money?:
    PaymentMoney;

  metadata?:
    Record<string, unknown>;
}

export interface StoredPaymentState {
  id: string;

  status:
    PaymentStatus;

  providerName?: string;

  providerOrderId?: string;
  providerPaymentId?: string;
  providerRefundId?: string;

  money?:
    PaymentMoney;

  metadata?:
    Record<string, unknown>;
}

export interface PaymentStateStore {
  updatePaymentState(
    input:
      UpdatePaymentStateInput,
  ): Promise<StoredPaymentState | null>;
}

export class NoopPaymentStateStore
  implements PaymentStateStore
{
  async updatePaymentState(
    input:
      UpdatePaymentStateInput,
  ): Promise<StoredPaymentState> {
    return {
      id:
        input.paymentId,

      status:
        input.status,

      providerName:
        input.providerName,

      providerOrderId:
        input.providerOrderId,

      providerPaymentId:
        input.providerPaymentId,

      providerRefundId:
        input.providerRefundId,

      money:
        input.money,

      metadata:
        input.metadata,
    };
  }
}
