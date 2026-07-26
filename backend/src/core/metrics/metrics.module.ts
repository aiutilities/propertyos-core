import { Module } from '@nestjs/common';

import { PostgresModule } from '../../database/postgres/postgres.module';
import { IdentityModule } from '../identity/identity.module';
import { AuthModule } from '../auth/auth.module';
import { ConsolePlatformLogger } from '../platform/logging/console-platform.logger';
import { MetricsController } from './controllers/metrics.controller';
import { METRICS_REPOSITORY } from './repositories/metrics.repository';
import { PostgresMetricsRepository } from './repositories/postgres-metrics.repository';
import { MetricsService } from './services/metrics.service';

@Module({
  imports: [
    PostgresModule,
    IdentityModule,
    AuthModule,
  ],
  controllers: [MetricsController],
  providers: [
    MetricsService,
    ConsolePlatformLogger,
    {
      provide: METRICS_REPOSITORY,
      useClass: PostgresMetricsRepository,
    },
  ],
  exports: [MetricsService],
})
export class MetricsModule {}
