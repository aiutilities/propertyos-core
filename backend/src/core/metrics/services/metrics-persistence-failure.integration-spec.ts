import {
  describe,
  expect,
  it,
} from '@jest/globals';

import {
  ConsolePlatformLogger,
} from '../../platform/logging/console-platform.logger';
import {
  MetricsRepository,
} from '../repositories/metrics.repository';
import {
  MetricSample,
} from '../types/metric.types';
import {
  MetricsService,
} from './metrics.service';

class RejectingMetricsRepository
implements MetricsRepository {
  readonly attemptedNames: string[] = [];

  async saveSample(
    sample: MetricSample,
  ): Promise<MetricSample> {
    this.attemptedNames.push(
      sample.name,
    );

    throw new Error(
      'sensitive persistence failure',
    );
  }

  async listSamples(): Promise<MetricSample[]> {
    return [];
  }

  async clearSamples(): Promise<void> {}
}

class ThrowingMetricsRepository
implements MetricsRepository {
  saveSample(
    _sample: MetricSample,
  ): Promise<MetricSample> {
    throw new Error(
      'sensitive synchronous failure',
    );
  }

  async listSamples(): Promise<MetricSample[]> {
    return [];
  }

  async clearSamples(): Promise<void> {}
}

class CapturingLogger
extends ConsolePlatformLogger {
  readonly warnings: Array<{
    message: string;
    context?: Record<string, unknown>;
  }> = [];

  override warn(
    message: string,
    context?: Record<string, unknown>,
  ): void {
    this.warnings.push({
      message,
      context,
    });
  }
}

describe(
  'Metrics persistence failure containment',
  () => {
    it(
      'retains all metric types and catches asynchronous persistence rejection',
      async () => {
        const repository =
          new RejectingMetricsRepository();

        const logger =
          new CapturingLogger();

        const service =
          new MetricsService(
            repository,
            logger,
          );

        const counter =
          service.incrementCounter({
            name:
              'containment_counter_total',
            help:
              'Containment counter.',
          });

        const gauge =
          service.setGauge({
            name:
              'containment_gauge',
            help:
              'Containment gauge.',
            value:
              2,
          });

        const histogram =
          service.observeHistogram({
            name:
              'containment_duration_ms',
            help:
              'Containment histogram.',
            value:
              3,
          });

        await new Promise<void>(
          (resolve) => {
            setImmediate(resolve);
          },
        );

        expect(
          service.listSamples(),
        ).toEqual([
          counter,
          gauge,
          histogram,
        ]);

        expect(
          repository.attemptedNames,
        ).toEqual([
          'containment_counter_total',
          'containment_gauge',
          'containment_duration_ms',
        ]);

        expect(
          logger.warnings,
        ).toHaveLength(3);

        for (
          const warning of
          logger.warnings
        ) {
          expect(
            warning.message,
          ).toBe(
            'metrics.sample.persistence_failed',
          );

          expect(
            warning.context,
          ).toEqual(
            expect.objectContaining({
              metricName:
                expect.any(String),
              metricType:
                expect.stringMatching(
                  /^(counter|gauge|histogram)$/,
                ),
            }),
          );

          expect(
            JSON.stringify(warning),
          ).not.toContain(
            'sensitive persistence failure',
          );
        }
      },
    );

    it(
      'contains synchronous repository failure',
      () => {
        const logger =
          new CapturingLogger();

        const service =
          new MetricsService(
            new ThrowingMetricsRepository(),
            logger,
          );

        expect(() =>
          service.incrementCounter({
            name:
              'synchronous_failure_total',
            help:
              'Synchronous containment.',
          }),
        ).not.toThrow();

        expect(
          service.listSamples(),
        ).toHaveLength(1);

        expect(
          logger.warnings,
        ).toEqual([
          {
            message:
              'metrics.sample.persistence_failed',
            context: {
              metricName:
                'synchronous_failure_total',
              metricType:
                'counter',
            },
          },
        ]);
      },
    );
  },
);
