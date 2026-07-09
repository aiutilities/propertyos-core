import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { IdentityModule } from '../identity/identity.module';
import { SchedulerController } from './controllers/scheduler.controller';
import { PostgresSchedulerRepository } from './repositories/postgres-scheduler.repository';
import { SchedulerHandlerRegistry } from './registries/scheduler-handler.registry';
import { SchedulerService } from './services/scheduler.service';

@Module({
  imports: [DatabaseModule, IdentityModule],
  controllers: [SchedulerController],
  providers: [
    SchedulerService,
    PostgresSchedulerRepository,
    SchedulerHandlerRegistry,
  ],
  exports: [SchedulerService, SchedulerHandlerRegistry],
})
export class SchedulerModule {}
