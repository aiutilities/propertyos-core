import {
  ReconciliationLocalPayment,
  ReconciliationProviderPayment,
} from './payment-reconciliation.types';

export type PaymentReconciliationDifferenceType =
  | 'LOCAL_ONLY'
  | 'PROVIDER_ONLY'
  | 'STATUS_MISMATCH'
  | 'AMOUNT_MISMATCH'
  | 'CURRENCY_MISMATCH'
  | 'DUPLICATE_PROVIDER_PAYMENT';

export type PaymentReconciliationResolution =
  | 'NONE'
  | 'AUTO_UPDATE_LOCAL_STATUS'
  | 'MANUAL_REVIEW';

export interface PaymentReconciliationDifference {
  id: string;

  type:
    PaymentReconciliationDifferenceType;

  providerName:
    string;

  paymentId?:
    string;

  providerPaymentId?:
    string;

  local?:
    ReconciliationLocalPayment;

  provider?:
    ReconciliationProviderPayment;

  resolution:
    PaymentReconciliationResolution;

  message:
    string;

  metadata?:
    Record<string, unknown>;
}
