import { Module } from '@nestjs/common';

import { PostgresModule } from '../../database/postgres/postgres.module';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { EventBusModule } from '../eventbus/eventbus.module';
import { IdentityModule } from '../identity/identity.module';
import { PluginModule } from '../plugin/plugin.module';
import { SearchModule } from '../search';

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
