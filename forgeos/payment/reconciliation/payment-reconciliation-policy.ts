import {
  PaymentReconciliationDifferenceType,
  PaymentReconciliationResolution,
} from './payment-reconciliation-difference';

export interface PaymentReconciliationPolicy {
  resolutions:
    Partial<
      Record<
        PaymentReconciliationDifferenceType,
        PaymentReconciliationResolution
      >
    >;

  defaultResolution:
    PaymentReconciliationResolution;
}

export const DEFAULT_PAYMENT_RECONCILIATION_POLICY:
  PaymentReconciliationPolicy = {
    resolutions: {
      STATUS_MISMATCH:
        'MANUAL_REVIEW',

      AMOUNT_MISMATCH:
        'MANUAL_REVIEW',

      CURRENCY_MISMATCH:
        'MANUAL_REVIEW',

      LOCAL_ONLY:
        'MANUAL_REVIEW',

      PROVIDER_ONLY:
        'MANUAL_REVIEW',

      DUPLICATE_PROVIDER_PAYMENT:
        'MANUAL_REVIEW',
    },

    defaultResolution:
      'MANUAL_REVIEW',
  };

export function resolvePaymentReconciliationAction(
  type:
    PaymentReconciliationDifferenceType,

  policy:
    PaymentReconciliationPolicy,
): PaymentReconciliationResolution {
  return (
    policy.resolutions[type] ??
    policy.defaultResolution
  );
}
