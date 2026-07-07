import { Injectable } from '@nestjs/common';
import {
  CounterMetricInput,
  GaugeMetricInput,
  HistogramMetricInput,
  MetricSample,
} from '../types/metric.types';

@Injectable()
export class MetricsService {
  private readonly samples: MetricSample[] = [];

  incrementCounter(input: CounterMetricInput): MetricSample {
    const sample = this.createSample({
      type: 'counter',
      name: input.name,
      help: input.help,
      labels: input.labels,
      value: input.value ?? 1,
    });

    this.samples.push(sample);
    return sample;
  }

  setGauge(input: GaugeMetricInput): MetricSample {
    const sample = this.createSample({
      type: 'gauge',
      name: input.name,
      help: input.help,
      labels: input.labels,
      value: input.value,
    });

    this.samples.push(sample);
    return sample;
  }

  observeHistogram(input: HistogramMetricInput): MetricSample {
    const sample = this.createSample({
      type: 'histogram',
      name: input.name,
      help: input.help,
      labels: input.labels,
      value: input.value,
    });

    this.samples.push(sample);
    return sample;
  }

  listSamples(): MetricSample[] {
    return [...this.samples];
  }

  clear(): void {
    this.samples.length = 0;
  }

  private createSample(input: {
    type: MetricSample['type'];
    name: string;
    help: string;
    labels?: Record<string, string | number>;
    value: number;
  }): MetricSample {
    return {
      name: input.name,
      type: input.type,
      help: input.help,
      labels: input.labels,
      value: input.value,
      timestamp: new Date().toISOString(),
    };
  }
}
