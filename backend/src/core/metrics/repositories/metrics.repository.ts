import { MetricSample } from '../types/metric.types';

export const METRICS_REPOSITORY = Symbol('METRICS_REPOSITORY');

export interface MetricsRepository {
  saveSample(sample: MetricSample): Promise<MetricSample>;
  listSamples(filters?: {
    name?: string;
    type?: MetricSample['type'];
    limit?: number;
  }): Promise<MetricSample[]>;
  clearSamples(): Promise<void>;
}
