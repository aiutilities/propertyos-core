import { MetricSample } from '../types/metric.types';
import { MetricsRepository } from './metrics.repository';

export class InMemoryMetricsRepository implements MetricsRepository {
  private readonly samples: MetricSample[] = [];

  async saveSample(sample: MetricSample): Promise<MetricSample> {
    this.samples.push(sample);
    return sample;
  }

  async listSamples(filters: {
    name?: string;
    type?: MetricSample['type'];
    limit?: number;
  } = {}): Promise<MetricSample[]> {
    return this.samples
      .filter((sample) => !filters.name || sample.name === filters.name)
      .filter((sample) => !filters.type || sample.type === filters.type)
      .slice(-(filters.limit ?? 100));
  }

  async clearSamples(): Promise<void> {
    this.samples.length = 0;
  }
}
