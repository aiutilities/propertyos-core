import { Module } from '@nestjs/common';

import { DatabaseModule } from '@propertyos/core-contracts';
import { IdentityModule } from '@propertyos/core-contracts';
import { EventBusModule } from '@propertyos/core-contracts';
import { SchedulerModule } from '@propertyos/core-contracts';
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
