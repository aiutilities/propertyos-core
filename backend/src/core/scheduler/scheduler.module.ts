import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { IdentityModule } from '../identity/identity.module';
import { EventBusModule } from '../eventbus/eventbus.module';
import { ReportModule } from '../report/report.module';
import { SchedulerController } from './controllers/scheduler.controller';
import { PostgresSchedulerRepository } from './repositories/postgres-scheduler.repository';
import { SchedulerHandlerRegistry } from './registries/scheduler-handler.registry';
import { SchedulerService } from './services/scheduler.service';
import { ReportExportJobHandler } from './handlers/report-export-job.handler';

@Module({
  imports: [
    DatabaseModule,
    IdentityModule,
    EventBusModule,
    ReportModule,
  ],
  controllers: [SchedulerController],
  providers: [
    SchedulerService,
    PostgresSchedulerRepository,
    SchedulerHandlerRegistry,
    ReportExportJobHandler,
  ],
  exports: [SchedulerService, SchedulerHandlerRegistry],
})
export class SchedulerModule {}
