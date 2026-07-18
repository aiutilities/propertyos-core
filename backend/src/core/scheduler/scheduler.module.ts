import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { IdentityModule } from '../identity/identity.module';
import { EventBusModule } from '../eventbus/eventbus.module';
import { PlatformModule } from '../platform';
import { SchedulerController } from './controllers/scheduler.controller';
import { PostgresSchedulerRepository } from './repositories/postgres-scheduler.repository';
import { SchedulerHandlerRegistry } from './registries/scheduler-handler.registry';
import { SchedulerService } from './services/scheduler.service';
import { SchedulerWorkerService } from './services/scheduler-worker.service';

@Module({
  imports: [
    DatabaseModule,
    IdentityModule,
    EventBusModule,
    PlatformModule,
  ],
  controllers: [SchedulerController],
  providers: [
    SchedulerService,
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
