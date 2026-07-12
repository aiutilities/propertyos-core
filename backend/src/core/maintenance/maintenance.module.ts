import { Module } from '@nestjs/common';

import { PostgresModule } from '../../database/postgres/postgres.module';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { EventBusModule } from '../eventbus/eventbus.module';
import { IdentityModule } from '../identity/identity.module';
import { PluginModule } from '../plugin/plugin.module';
import { SearchModule } from '../search';
import { SchedulerModule } from '../scheduler';
import { WorkflowModule } from '../workflow';

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
