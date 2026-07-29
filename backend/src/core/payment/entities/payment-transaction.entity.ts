import {
  PaymentMoney,
  PaymentStatus,
} from '@forgeos/payment';

export interface PaymentTransaction {
  id: string;

  source:
    string;

  sourceReferenceId?:
    string;

  providerName:
    string;

  providerOrderId?:
    string;

  providerPaymentId?:
    string;

  providerRefundId?:
    string;

  idempotencyKey:
    string;

  status:
    PaymentStatus;

  money:
    PaymentMoney;

  customerId?:
    string;

  description?:
    string;

  failureCode?:
    string;

  failureMessage?:
    string;

  metadata:
    Record<string, unknown>;

  createdAt:
    Date;

  updatedAt:
    Date;
}
