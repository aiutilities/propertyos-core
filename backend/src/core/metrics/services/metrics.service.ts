import { Inject, Injectable } from '@nestjs/common';
import * as os from 'os';
import { ConsolePlatformLogger } from '../../platform/logging/console-platform.logger';
import {
  CounterMetricInput,
  GaugeMetricInput,
  HistogramMetricInput,
  MetricSample,
} from '../types/metric.types';
import { InMemoryMetricsRepository } from '../repositories/inmemory-metrics.repository';
import { METRICS_REPOSITORY, MetricsRepository } from '../repositories/metrics.repository';

@Injectable()
export class MetricsService {
  private readonly samples: MetricSample[] = [];

  constructor(
    @Inject(METRICS_REPOSITORY)
    private readonly repository: MetricsRepository = new InMemoryMetricsRepository(),
    private readonly logger: ConsolePlatformLogger = new ConsolePlatformLogger(),
  ) {}


  incrementCounter(input: CounterMetricInput): MetricSample {
    const sample = this.createSample({
      type: 'counter',
      name: input.name,
      help: input.help,
      labels: input.labels,
      value: input.value ?? 1,
    });

    this.samples.push(sample);
    this.persistSample(sample);
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
    this.persistSample(sample);
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
    this.persistSample(sample);
    return sample;
  }

  listSamples(): MetricSample[] {
    return [...this.samples];
  }

  listPersistentSamples(filters?: {
    name?: string;
    type?: MetricSample['type'];
    limit?: number;
  }): Promise<MetricSample[]> {
    return this.repository.listSamples(filters);
  }

  getRuntimeMetrics() {
    const memoryUsage = process.memoryUsage();

    return {
      pid: process.pid,
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      uptimeSeconds: Math.floor(process.uptime()),
      cpuCount: os.cpus().length,
      loadAverage: os.loadavg(),
      memory: {
        rss: memoryUsage.rss,
        heapTotal: memoryUsage.heapTotal,
        heapUsed: memoryUsage.heapUsed,
        external: memoryUsage.external,
        arrayBuffers: memoryUsage.arrayBuffers,
      },
    };
  }

  getPrometheusMetrics(): string {
    const runtime = this.getRuntimeMetrics();
    const lines: string[] = [];

    this.appendPrometheusMetric(lines, {
      name: 'process_uptime_seconds',
      type: 'gauge',
      help: 'Process uptime in seconds.',
      value: runtime.uptimeSeconds,
    });

    this.appendPrometheusMetric(lines, {
      name: 'process_cpu_count',
      type: 'gauge',
      help: 'Number of CPUs available to the process.',
      value: runtime.cpuCount,
    });

    this.appendPrometheusMetric(lines, {
      name: 'process_memory_rss_bytes',
      type: 'gauge',
      help: 'Resident set size memory used by the process in bytes.',
      value: runtime.memory.rss,
    });

    this.appendPrometheusMetric(lines, {
      name: 'process_memory_heap_total_bytes',
      type: 'gauge',
      help: 'Total heap memory allocated by the process in bytes.',
      value: runtime.memory.heapTotal,
    });

    this.appendPrometheusMetric(lines, {
      name: 'process_memory_heap_used_bytes',
      type: 'gauge',
      help: 'Heap memory used by the process in bytes.',
      value: runtime.memory.heapUsed,
    });

    this.appendPrometheusMetric(lines, {
      name: 'process_memory_external_bytes',
      type: 'gauge',
      help: 'External memory used by the process in bytes.',
      value: runtime.memory.external,
    });

    this.appendPrometheusMetric(lines, {
      name: 'process_memory_array_buffers_bytes',
      type: 'gauge',
      help: 'Array buffer memory used by the process in bytes.',
      value: runtime.memory.arrayBuffers,
    });

    this.appendPrometheusMetric(lines, {
      name: 'system_load_average_1m',
      type: 'gauge',
      help: 'System load average over the last 1 minute.',
      value: runtime.loadAverage[0] ?? 0,
    });

    this.appendPrometheusMetric(lines, {
      name: 'system_load_average_5m',
      type: 'gauge',
      help: 'System load average over the last 5 minutes.',
      value: runtime.loadAverage[1] ?? 0,
    });

    this.appendPrometheusMetric(lines, {
      name: 'system_load_average_15m',
      type: 'gauge',
      help: 'System load average over the last 15 minutes.',
      value: runtime.loadAverage[2] ?? 0,
    });

    for (const sample of this.samples) {
      this.appendPrometheusMetric(lines, {
        name: sample.name,
        type: sample.type,
        help: sample.help,
        labels: sample.labels,
        value: sample.value,
      });
    }

    return `${lines.join('\n')}\n`;
  }

  async clear(): Promise<void> {
    this.samples.length = 0;
    await this.repository.clearSamples();
  }

  private persistSample(
    sample: MetricSample,
  ): void {
    try {
      void this.repository
        .saveSample(sample)
        .catch(() => {
          this.logPersistenceFailure(sample);
        });
    } catch {
      this.logPersistenceFailure(sample);
    }
  }

  private logPersistenceFailure(
    sample: MetricSample,
  ): void {
    this.logger.warn(
      'metrics.sample.persistence_failed',
      {
        metricName: sample.name,
        metricType: sample.type,
      },
    );
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

  private appendPrometheusMetric(
    lines: string[],
    input: {
      name: string;
      type: MetricSample['type'];
      help: string;
      labels?: Record<string, string | number>;
      value: number;
    },
  ): void {
    lines.push(`# HELP ${input.name} ${this.escapeHelp(input.help)}`);
    lines.push(`# TYPE ${input.name} ${input.type}`);
    lines.push(
      `${input.name}${this.formatLabels(input.labels)} ${this.formatValue(input.value)}`,
    );
  }

  private formatLabels(labels?: Record<string, string | number>): string {
    if (!labels || Object.keys(labels).length === 0) {
      return '';
    }

    const formattedLabels = Object.entries(labels)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, value]) => `${key}="${this.escapeLabelValue(String(value))}"`)
      .join(',');

    return `{${formattedLabels}}`;
  }

  private formatValue(value: number): string {
    if (!Number.isFinite(value)) {
      return '0';
    }

    return String(value);
  }

  private escapeHelp(value: string): string {
    return value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n');
  }

  private escapeLabelValue(value: string): string {
    return value
      .replace(/\\/g, '\\\\')
      .replace(/\n/g, '\\n')
      .replace(/"/g, '\\"');
  }
}
