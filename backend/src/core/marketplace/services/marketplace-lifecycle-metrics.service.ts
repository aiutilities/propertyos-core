import {
  Injectable,
} from '@nestjs/common';

import {
  MetricsService,
} from '../../metrics/services/metrics.service';

export type MarketplaceLifecycleOperation =
  | 'install'
  | 'upgrade'
  | 'rollback'
  | 'uninstall';

@Injectable()
export class MarketplaceLifecycleMetricsService {
  constructor(
    private readonly metrics:
      MetricsService,
  ) {}

  async observe<T>(
    operation:
      MarketplaceLifecycleOperation,
    execute:
      () => Promise<T>,
  ): Promise<T> {
    const startedAt =
      Date.now();

    this.metrics.incrementCounter({
      name:
        'propertyos_marketplace_lifecycle_requests_total',
      help:
        'Total Marketplace lifecycle operation requests.',
      labels: {
        operation,
      },
    });

    try {
      const result =
        await execute();

      this.metrics.incrementCounter({
        name:
          'propertyos_marketplace_lifecycle_success_total',
        help:
          'Total successful Marketplace lifecycle operations.',
        labels: {
          operation,
        },
      });

      return result;
    } catch (error) {
      this.metrics.incrementCounter({
        name:
          'propertyos_marketplace_lifecycle_failures_total',
        help:
          'Total failed Marketplace lifecycle operations.',
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
          'propertyos_marketplace_lifecycle_duration_ms',
        help:
          'Marketplace lifecycle operation duration in milliseconds.',
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
