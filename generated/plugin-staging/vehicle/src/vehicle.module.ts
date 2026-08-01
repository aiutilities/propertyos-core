import { Module } from '@nestjs/common';

import { PostgresModule } from '@propertyos/core-contracts';
import { AuditModule } from '@propertyos/core-contracts';
import { AuthModule } from '@propertyos/core-contracts';
import { EventBusModule } from '@propertyos/core-contracts';
import { IdentityModule } from '@propertyos/core-contracts';
import { PluginModule } from '@propertyos/core-contracts';
import { SearchModule } from '@propertyos/core-contracts';

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
