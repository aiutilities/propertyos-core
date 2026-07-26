import {
  Injectable,
} from '@nestjs/common';

import {
  MetricsService,
} from '../../metrics/services/metrics.service';

export type ProcurementTransitionOperation =
  | 'goods_receipt_post'
  | 'purchase_order_issue'
  | 'payment_request_pay'
  | 'invoice_match_complete';

@Injectable()
export class ProcurementTransitionMetricsService {
  constructor(
    private readonly metrics:
      MetricsService,
  ) {}

  async observe<T>(
    operation:
      ProcurementTransitionOperation,
    execute:
      () => Promise<T>,
  ): Promise<T> {
    const startedAt =
      Date.now();

    this.metrics.incrementCounter({
      name:
        'propertyos_procurement_transition_requests_total',
      help:
        'Total Procurement transition requests.',
      labels: {
        operation,
      },
    });

    try {
      const result =
        await execute();

      this.metrics.incrementCounter({
        name:
          'propertyos_procurement_transition_success_total',
        help:
          'Total successful Procurement transitions.',
        labels: {
          operation,
        },
      });

      return result;
    } catch (error) {
      this.metrics.incrementCounter({
        name:
          'propertyos_procurement_transition_failures_total',
        help:
          'Total failed Procurement transitions.',
        labels: {
          operation,
          errorType:
            this.errorType(error),
        },
      });

      throw error;
    } finally {
      this.metrics.observeHistogram({
        name:
          'propertyos_procurement_transition_duration_ms',
        help:
          'Procurement transition duration in milliseconds.',
        labels: {
          operation,
        },
        value:
          Date.now() - startedAt,
      });
    }
  }

  private errorType(
    error: unknown,
  ): string {
    if (
      error instanceof Error &&
      error.name.trim()
    ) {
      return error.name;
    }

    return 'UnknownError';
  }
}
