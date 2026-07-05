import { Module } from '@nestjs/common';

import { PostgresModule } from '../../database/postgres/postgres.module';
import { IdentityModule } from '../identity/identity.module';
import { EventBusModule } from '../eventbus/eventbus.module';
import { RentController } from './controllers/rent.controller';
import {
  RENT_REPOSITORY,
  RentService,
} from './services/rent.service';
import { PostgresRentRepository } from './repositories/postgres-rent.repository';

@Module({
  imports: [PostgresModule, IdentityModule, EventBusModule],
  controllers: [RentController],
  providers: [
    RentService,
    {
      provide: RENT_REPOSITORY,
      useClass: PostgresRentRepository,
    },
  ],
  exports: [RentService],
})
export class RentModule {}
