import {
  PaymentReconciliationReport,
} from './payment-reconciliation-report';

export interface PaymentReconciliationReportStore {
  save(
    report:
      PaymentReconciliationReport,
  ): Promise<void>;
}

export class NoopPaymentReconciliationReportStore
  implements PaymentReconciliationReportStore
{
  async save(
    _report:
      PaymentReconciliationReport,
  ): Promise<void> {
    return;
  }
}
