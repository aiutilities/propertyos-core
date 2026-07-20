import { Module } from '@nestjs/common';

import { PostgresModule } from '../../database/postgres/postgres.module';
import { IdentityModule } from '../identity/identity.module';
import { PlatformModule } from '../platform/platform.module';
import { MetricsController } from './controllers/metrics.controller';
import { METRICS_REPOSITORY } from './repositories/metrics.repository';
import { PostgresMetricsRepository } from './repositories/postgres-metrics.repository';
import { MetricsService } from './services/metrics.service';

@Module({
  imports: [
    PostgresModule,
    IdentityModule,
    PlatformModule,
  ],
  controllers: [MetricsController],
  providers: [
    MetricsService,
    {
      provide: METRICS_REPOSITORY,
      useClass: PostgresMetricsRepository,
    },
  ],
  exports: [MetricsService],
})
export class MetricsModule {}
