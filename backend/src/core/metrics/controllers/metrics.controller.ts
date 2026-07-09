import { Controller, Get, Header, Query, UseGuards } from '@nestjs/common';
import { Permissions } from '../../auth/constants/permissions';
import { RequirePermission } from '../../auth/decorators/require-permission.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permission.guard';
import { MetricsService } from '../services/metrics.service';

@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @RequirePermission(Permissions.METRICS_READ)
  @Get()
  getMetrics() {
    return {
      status: 'ok',
      runtime: this.metricsService.getRuntimeMetrics(),
      samples: this.metricsService.listSamples(),
      timestamp: new Date().toISOString(),
    };
  }

  @RequirePermission(Permissions.METRICS_READ)
  @Get('runtime')
  getRuntimeMetrics() {
    return {
      status: 'ok',
      runtime: this.metricsService.getRuntimeMetrics(),
      timestamp: new Date().toISOString(),
    };
  }


  @RequirePermission(Permissions.METRICS_READ)
  @Get('samples')
  async listPersistentSamples(
    @Query('name') name?: string,
    @Query('type') type?: any,
    @Query('limit') limit?: string,
  ) {
    return {
      status: 'ok',
      samples: await this.metricsService.listPersistentSamples({
        name,
        type,
        limit: limit ? Number(limit) : undefined,
      }),
      timestamp: new Date().toISOString(),
    };
  }

  @RequirePermission(Permissions.METRICS_READ)
  @Get('prometheus')
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  getPrometheusMetrics(): string {
    return this.metricsService.getPrometheusMetrics();
  }
}
