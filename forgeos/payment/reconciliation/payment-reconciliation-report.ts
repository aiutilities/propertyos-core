import {
  PaymentReconciliationDifference,
} from './payment-reconciliation-difference';

import {
  PaymentReconciliationPeriod,
} from './payment-reconciliation.types';

export type PaymentReconciliationRunStatus =
  | 'COMPLETED'
  | 'FAILED';

export interface PaymentReconciliationReport {
  runId:
    string;

  providerName:
    string;

  period:
    PaymentReconciliationPeriod;

  status:
    PaymentReconciliationRunStatus;

  localPaymentCount:
    number;

  providerPaymentCount:
    number;

  matchedCount:
    number;

  differenceCount:
    number;

  automaticResolutionCount:
    number;

  manualReviewCount:
    number;

  differences:
    readonly PaymentReconciliationDifference[];

  startedAt:
    string;

  completedAt:
    string;

  durationMilliseconds:
    number;

  errorMessage?:
    string;

  metadata?:
    Record<string, unknown>;
}
