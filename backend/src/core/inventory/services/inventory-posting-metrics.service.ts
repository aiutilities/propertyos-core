import {
  Injectable,
} from '@nestjs/common';

import {
  MetricsService,
} from '../../metrics/services/metrics.service';

export type InventoryPostingOperation =
  | 'material_issue'
  | 'material_return'
  | 'stock_adjustment'
  | 'transfer_dispatch'
  | 'transfer_receive';

@Injectable()
export class InventoryPostingMetricsService {
  constructor(
    private readonly metrics:
      MetricsService,
  ) {}

  async observe<T>(
    operation:
      InventoryPostingOperation,
    execute:
      () => Promise<T>,
  ): Promise<T> {
    const startedAt =
      Date.now();

    this.metrics.incrementCounter({
      name:
        'propertyos_inventory_posting_requests_total',
      help:
        'Total Inventory posting operation requests.',
      labels: {
        operation,
      },
    });

    try {
      const result =
        await execute();

      this.metrics.incrementCounter({
        name:
          'propertyos_inventory_posting_success_total',
        help:
          'Total successful Inventory posting operations.',
        labels: {
          operation,
        },
      });

      return result;
    } catch (error) {
      this.metrics.incrementCounter({
        name:
          'propertyos_inventory_posting_failures_total',
        help:
          'Total failed Inventory posting operations.',
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
          'propertyos_inventory_posting_duration_ms',
        help:
          'Inventory posting operation duration in milliseconds.',
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
