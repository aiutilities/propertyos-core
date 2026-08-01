import { Module } from '@nestjs/common';

import { PostgresModule } from '@propertyos/core-contracts';
import { AuditModule } from '@propertyos/core-contracts';
import { AuthModule } from '@propertyos/core-contracts';
import { EventBusModule } from '@propertyos/core-contracts';
import { IdentityModule } from '@propertyos/core-contracts';
import { PluginModule } from '@propertyos/core-contracts';
import { SearchModule } from '@propertyos/core-contracts';

import { StaffBootstrapService } from './bootstrap/staff-bootstrap.service';
import { StaffController } from './controllers/staff.controller';
import {
  STAFF_REPOSITORY,
} from './repositories/staff.repository';
import { PostgresStaffRepository } from './repositories/postgres-staff.repository';
import { StaffService } from './services/staff.service';
import { StaffSearchProviderService } from './staff-search-provider.service';

@Module({
  imports: [
    AuditModule,
    AuthModule,
    EventBusModule,
    IdentityModule,
    PluginModule,
    PostgresModule,
    SearchModule,
  ],
  controllers: [
    StaffController,
  ],
  providers: [
    StaffBootstrapService,
    StaffService,
    StaffSearchProviderService,
    {
      provide: STAFF_REPOSITORY,
      useClass: PostgresStaffRepository,
    },
  ],
  exports: [
    StaffService,
  ],
})
export class StaffModule {}
