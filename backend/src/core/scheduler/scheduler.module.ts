import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { IdentityModule } from '../identity/identity.module';
import { MetricsModule } from '../metrics/metrics.module';
import { EventBusModule } from '../eventbus/eventbus.module';
import { PlatformModule } from '../platform';
import { SchedulerController } from './controllers/scheduler.controller';
import { PostgresSchedulerRepository } from './repositories/postgres-scheduler.repository';
import { SchedulerHandlerRegistry } from './registries/scheduler-handler.registry';
import { SchedulerService } from './services/scheduler.service';
import { SchedulerWorkerService } from './services/scheduler-worker.service';
import { SchedulerExecutionMetricsService } from './services/scheduler-execution-metrics.service';

@Module({
  imports: [
    DatabaseModule,
    IdentityModule,
    EventBusModule,
    MetricsModule,
    PlatformModule,
  ],
  controllers: [SchedulerController],
  providers: [
    SchedulerService,
    SchedulerExecutionMetricsService,
    SchedulerWorkerService,
    PostgresSchedulerRepository,
    SchedulerHandlerRegistry,
  ],
  exports: [
    SchedulerService,
    SchedulerWorkerService,
    SchedulerHandlerRegistry,
  ],
})
export class SchedulerModule {}
