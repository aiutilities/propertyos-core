import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module';
import { IdentityModule } from '../identity/identity.module';
import { EventBusModule } from '../eventbus/eventbus.module';
import { SchedulerModule } from '../scheduler/scheduler.module';
import { ReportController } from './controllers/report.controller';
import { PostgresReportRepository } from './repositories/postgres-report.repository';
import { REPORT_REPOSITORY } from './repositories/report-repository.interface';
import { ReportExportService } from './services/report-export.service';
import { ReportExportJobHandler } from './handlers/report-export-job.handler';
import { ReportService } from './services/report.service';

@Module({
  imports: [
    DatabaseModule,
    IdentityModule,
    EventBusModule,
    SchedulerModule,
  ],
  controllers: [ReportController],
  providers: [
    ReportService,
    ReportExportService,
    ReportExportJobHandler,
    {
      provide: REPORT_REPOSITORY,
      useClass: PostgresReportRepository,
    },
  ],
  exports: [ReportService, ReportExportService],
})
export class ReportModule {}
