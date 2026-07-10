import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { IdentityModule } from '../identity/identity.module';
import { EventBusModule } from '../eventbus/eventbus.module';
import { ReportModule } from '../report/report.module';
import { PlatformModule } from '../platform';
import { SchedulerController } from './controllers/scheduler.controller';
import { PostgresSchedulerRepository } from './repositories/postgres-scheduler.repository';
import { SchedulerHandlerRegistry } from './registries/scheduler-handler.registry';
import { SchedulerService } from './services/scheduler.service';
import { SchedulerWorkerService } from './services/scheduler-worker.service';
import { ReportExportJobHandler } from './handlers/report-export-job.handler';

@Module({
  imports: [
    DatabaseModule,
    IdentityModule,
    EventBusModule,
    ReportModule,
    PlatformModule,
  ],
  controllers: [SchedulerController],
  providers: [
    SchedulerService,
    SchedulerWorkerService,
    PostgresSchedulerRepository,
    SchedulerHandlerRegistry,
    ReportExportJobHandler,
  ],
  exports: [
    SchedulerService,
    SchedulerWorkerService,
    SchedulerHandlerRegistry,
  ],
})
export class SchedulerModule {}
