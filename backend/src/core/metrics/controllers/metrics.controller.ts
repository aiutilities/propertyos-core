import { Controller, Get } from '@nestjs/common';
import { MetricsService } from '../services/metrics.service';

@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  getMetrics() {
    return {
      status: 'ok',
      samples: this.metricsService.listSamples(),
      timestamp: new Date().toISOString(),
    };
  }
}
