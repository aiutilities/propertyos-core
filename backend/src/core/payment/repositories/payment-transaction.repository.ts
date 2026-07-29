import {
  PaymentStatus,
  UpdatePaymentStateInput,
} from '@forgeos/payment';

import {
  PaymentTransaction,
} from '../entities';

export interface PaymentTransactionFilters {
  providerName?:
    string;

  status?:
    PaymentStatus;

  source?:
    string;

  sourceReferenceId?:
    string;

  customerId?:
    string;
}

export abstract class PaymentTransactionRepository {
  abstract create(
    transaction:
      PaymentTransaction,
  ): Promise<
    PaymentTransaction
  >;

  abstract findById(
    id: string,
  ): Promise<
    PaymentTransaction |
    null
  >;

  abstract findByIdempotencyKey(
    idempotencyKey:
      string,
  ): Promise<
    PaymentTransaction |
    null
  >;

  abstract findByProviderIdentifiers(
    providerName:
      string,

    identifiers: {
      providerOrderId?:
        string;

      providerPaymentId?:
        string;

      providerRefundId?:
        string;
    },
  ): Promise<
    PaymentTransaction |
    null
  >;

  abstract updateState(
    input:
      UpdatePaymentStateInput,
  ): Promise<
    PaymentTransaction |
    null
  >;

  abstract list(
    filters?:
      PaymentTransactionFilters,
  ): Promise<
    PaymentTransaction[]
  >;

  abstract listForReconciliation(
    providerName:
      string,

    periodStart:
      Date,

    periodEnd:
      Date,
  ): Promise<
    PaymentTransaction[]
  >;
}
