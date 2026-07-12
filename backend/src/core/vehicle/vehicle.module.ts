import { Module } from '@nestjs/common';

import { PostgresModule } from '../../database/postgres/postgres.module';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { EventBusModule } from '../eventbus/eventbus.module';
import { IdentityModule } from '../identity/identity.module';
import { PluginModule } from '../plugin/plugin.module';
import { SearchModule } from '../search';

import { VehicleBootstrapService } from './bootstrap/vehicle-bootstrap.service';
import { VehicleController } from './controllers/vehicle.controller';
import {
  VEHICLE_REPOSITORY,
} from './repositories/vehicle.repository';
import { PostgresVehicleRepository } from './repositories/postgres-vehicle.repository';
import { VehicleService } from './services/vehicle.service';
import { VehicleSearchProviderService } from './vehicle-search-provider.service';

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
    VehicleController,
  ],
  providers: [
    VehicleBootstrapService,
    VehicleService,
    VehicleSearchProviderService,
    {
      provide: VEHICLE_REPOSITORY,
      useClass: PostgresVehicleRepository,
    },
  ],
  exports: [
    VehicleService,
  ],
})
export class VehicleModule {}
