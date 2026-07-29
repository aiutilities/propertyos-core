import {
  PaymentMoney,
  PaymentStatus,
} from '../contracts';

export interface ReconciliationLocalPayment {
  paymentId: string;

  providerName: string;

  providerOrderId?: string;
  providerPaymentId?: string;

  status:
    PaymentStatus;

  money:
    PaymentMoney;

  updatedAt:
    string;

  metadata?:
    Record<string, unknown>;
}

export interface ReconciliationProviderPayment {
  providerName: string;

  providerOrderId?: string;
  providerPaymentId: string;

  status:
    PaymentStatus;

  money:
    PaymentMoney;

  updatedAt:
    string;

  metadata?:
    Record<string, unknown>;
}

export interface PaymentReconciliationPeriod {
  start:
    string;

  end:
    string;
}

export interface ReconciliationProviderQuery {
  period:
    PaymentReconciliationPeriod;

  cursor?:
    string;

  limit?:
    number;
}

export interface ReconciliationProviderPaymentPage {
  payments:
    readonly ReconciliationProviderPayment[];

  nextCursor?:
    string;
}

export interface ReconciliationLocalPaymentQuery {
  providerName:
    string;

  period:
    PaymentReconciliationPeriod;
}

export interface PaymentReconciliationProvider {
  readonly name:
    string;

  listPayments(
    query:
      ReconciliationProviderQuery,
  ): Promise<
    ReconciliationProviderPaymentPage
  >;
}

export interface PaymentReconciliationLocalStore {
  listPayments(
    query:
      ReconciliationLocalPaymentQuery,
  ): Promise<
    readonly ReconciliationLocalPayment[]
  >;
}
