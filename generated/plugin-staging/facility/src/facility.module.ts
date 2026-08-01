import { Module } from '@nestjs/common';

import { PostgresModule } from '@propertyos/core-contracts';
import { AuditModule } from '@propertyos/core-contracts';
import { AuthModule } from '@propertyos/core-contracts';
import { EventBusModule } from '@propertyos/core-contracts';
import { IdentityModule } from '@propertyos/core-contracts';
import { PluginModule } from '@propertyos/core-contracts';
import { SearchModule } from '@propertyos/core-contracts';
import { WorkflowModule } from '@propertyos/core-contracts';

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
