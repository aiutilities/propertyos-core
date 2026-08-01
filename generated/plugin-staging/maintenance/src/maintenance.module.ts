import { Module } from '@nestjs/common';

import { PostgresModule } from '@propertyos/core-contracts';
import { AuditModule } from '@propertyos/core-contracts';
import { AuthModule } from '@propertyos/core-contracts';
import { EventBusModule } from '@propertyos/core-contracts';
import { IdentityModule } from '@propertyos/core-contracts';
import { PluginModule } from '@propertyos/core-contracts';
import { SearchModule } from '@propertyos/core-contracts';
import { SchedulerModule } from '@propertyos/core-contracts';
import { WorkflowModule } from '@propertyos/core-contracts';

import { MaintenanceBootstrapService } from './bootstrap/maintenance-bootstrap.service';
import { MaintenanceWorkflowBootstrapService } from './bootstrap/maintenance-workflow-bootstrap.service';
import { MaintenanceController } from './controllers/maintenance.controller';
import {
  MAINTENANCE_REPOSITORY,
} from './repositories/maintenance.repository';
import { PostgresMaintenanceRepository } from './repositories/postgres-maintenance.repository';
import { MaintenanceService } from './services/maintenance.service';
import { MaintenanceSlaService } from './services/maintenance-sla.service';
import { MaintenanceSlaWarningJobHandler } from './handlers/maintenance-sla-warning-job.handler';
import { MaintenanceSlaOverdueJobHandler } from './handlers/maintenance-sla-overdue-job.handler';
import { MaintenanceSearchProviderService } from './maintenance-search-provider.service';

@Module({
  imports: [
    AuditModule,
    AuthModule,
    IdentityModule,
    PostgresModule,
    EventBusModule,
    PluginModule,
    SearchModule,
    SchedulerModule,
    WorkflowModule,
  ],
  controllers: [
    MaintenanceController,
  ],
  providers: [
    MaintenanceBootstrapService,
    MaintenanceWorkflowBootstrapService,
    MaintenanceSearchProviderService,
    MaintenanceService,
    MaintenanceSlaService,
    MaintenanceSlaWarningJobHandler,
    MaintenanceSlaOverdueJobHandler,
    {
      provide: MAINTENANCE_REPOSITORY,
      useClass: PostgresMaintenanceRepository,
    },
  ],
  exports: [
    MaintenanceService,
    MaintenanceSlaService,
    MaintenanceSlaWarningJobHandler,
    MaintenanceSlaOverdueJobHandler,
  ],
})
export class MaintenanceModule {}
