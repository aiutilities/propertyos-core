export type MetricType = 'counter' | 'gauge' | 'histogram';

export interface MetricSample {
  name: string;
  type: MetricType;
  help: string;
  labels?: Record<string, string | number>;
  value: number;
  timestamp: string;
}

export interface CounterMetricInput {
  name: string;
  help: string;
  labels?: Record<string, string | number>;
  value?: number;
}

export interface GaugeMetricInput {
  name: string;
  help: string;
  labels?: Record<string, string | number>;
  value: number;
}

export interface HistogramMetricInput {
  name: string;
  help: string;
  labels?: Record<string, string | number>;
  value: number;
}
