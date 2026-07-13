import { Module } from '@nestjs/common';

import { PostgresModule } from '../../database/postgres/postgres.module';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { EventBusModule } from '../eventbus/eventbus.module';
import { IdentityModule } from '../identity/identity.module';
import { PluginModule } from '../plugin/plugin.module';
import { SearchModule } from '../search';
import { WorkflowModule } from '../workflow';

import { FacilityBootstrapService } from './bootstrap/facility-bootstrap.service';
import { FacilityWorkflowBootstrapService } from './bootstrap/facility-workflow-bootstrap.service';
import { FacilityController } from './controllers/facility.controller';
import {
  FACILITY_REPOSITORY,
} from './repositories/facility.repository';
import { PostgresFacilityRepository } from './repositories/postgres-facility.repository';
import { FacilityService } from './services/facility.service';
import { FacilitySearchProviderService } from './facility-search-provider.service';

@Module({
  imports: [
    AuditModule,
    AuthModule,
    EventBusModule,
    IdentityModule,
    PluginModule,
    PostgresModule,
    SearchModule,
    WorkflowModule,
  ],
  controllers: [
    FacilityController,
  ],
  providers: [
    FacilityBootstrapService,
    FacilityWorkflowBootstrapService,
    FacilityService,
    FacilitySearchProviderService,
    {
      provide: FACILITY_REPOSITORY,
      useClass: PostgresFacilityRepository,
    },
  ],
  exports: [
    FacilityService,
    FacilitySearchProviderService,
  ],
})
export class FacilityModule {}
