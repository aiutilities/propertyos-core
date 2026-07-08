import { Controller, Get, Header } from '@nestjs/common';
import { MetricsService } from '../services/metrics.service';

@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  getMetrics() {
    return {
      status: 'ok',
      runtime: this.metricsService.getRuntimeMetrics(),
      samples: this.metricsService.listSamples(),
      timestamp: new Date().toISOString(),
    };
  }

  @Get('runtime')
  getRuntimeMetrics() {
    return {
      status: 'ok',
      runtime: this.metricsService.getRuntimeMetrics(),
      timestamp: new Date().toISOString(),
    };
  }

  @Get('prometheus')
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  getPrometheusMetrics(): string {
    return this.metricsService.getPrometheusMetrics();
  }
}
