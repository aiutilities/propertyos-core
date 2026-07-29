export type PaymentReconciliationStatus =
  | 'PENDING'
  | 'RUNNING'
  | 'COMPLETED'
  | 'FAILED';

export interface PaymentReconciliationRun {
  id: string;

  providerName:
    string;

  status:
    PaymentReconciliationStatus;

  periodStart:
    Date;

  periodEnd:
    Date;

  examinedCount:
    number;

  matchedCount:
    number;

  mismatchCount:
    number;

  errorMessage?:
    string;

  metadata:
    Record<string, unknown>;

  startedAt?:
    Date;

  completedAt?:
    Date;

  createdAt:
    Date;

  updatedAt:
    Date;
}
