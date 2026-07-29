import {
  PaymentReconciliationRun,
  PaymentReconciliationStatus,
} from '../entities';

export abstract class PaymentReconciliationRepository {
  abstract create(
    run:
      PaymentReconciliationRun,
  ): Promise<
    PaymentReconciliationRun
  >;

  abstract findById(
    id: string,
  ): Promise<
    PaymentReconciliationRun |
    null
  >;

  abstract updateStatus(
    id: string,

    status:
      PaymentReconciliationStatus,

    input?: {
      examinedCount?:
        number;

      matchedCount?:
        number;

      mismatchCount?:
        number;

      errorMessage?:
        string;

      startedAt?:
        Date;

      completedAt?:
        Date;

      metadata?:
        Record<string, unknown>;
    },
  ): Promise<
    PaymentReconciliationRun
  >;

  abstract listByProvider(
    providerName:
      string,
  ): Promise<
    PaymentReconciliationRun[]
  >;
}
