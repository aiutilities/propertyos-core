import { Module } from '@nestjs/common';

import { PostgresModule } from '@propertyos/core-contracts';
import { IdentityModule } from '@propertyos/core-contracts';
import { EventBusModule } from '@propertyos/core-contracts';
import { SearchModule } from '@propertyos/core-contracts';
import { PluginModule } from '@propertyos/core-contracts';

import { RentController } from './controllers/rent.controller';
import {
  RENT_REPOSITORY,
  RentService,
} from './services/rent.service';
import { PostgresRentRepository } from './repositories/postgres-rent.repository';
import { RentSearchProviderService } from './rent-search-provider.service';
import { RentDashboardContributorService } from './services/rent-dashboard-contributor.service';

@Module({
  imports: [
    PostgresModule,
    IdentityModule,
    EventBusModule,
    SearchModule,
    PluginModule,
  ],
  controllers: [RentController],
  providers: [
    RentService,
    RentSearchProviderService,
    RentDashboardContributorService,
    {
      provide: RENT_REPOSITORY,
      useClass: PostgresRentRepository,
    },
  ],
  exports: [RentService],
})
export class RentModule {}
