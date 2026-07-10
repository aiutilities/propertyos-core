import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module';
import { IdentityModule } from '../identity/identity.module';
import { ReportController } from './controllers/report.controller';
import { PostgresReportRepository } from './repositories/postgres-report.repository';
import { REPORT_REPOSITORY } from './repositories/report-repository.interface';
import { ReportExportService } from './services/report-export.service';
import { ReportService } from './services/report.service';

@Module({
  imports: [DatabaseModule, IdentityModule],
  controllers: [ReportController],
  providers: [
    ReportService,
    ReportExportService,
    {
      provide: REPORT_REPOSITORY,
      useClass: PostgresReportRepository,
    },
  ],
  exports: [ReportService, ReportExportService],
})
export class ReportModule {}
