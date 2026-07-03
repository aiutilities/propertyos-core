import { Module } from '@nestjs/common';
import { PostgresModule } from '../../database/postgres/postgres.module';

import { PropertyController } from './controllers/property.controller';

import {
  PROPERTY_REPOSITORY,
  PropertyService,
} from './services/property.service';

import { PostgresPropertyRepository } from './repositories/postgres-property.repository';

@Module({
  imports: [PostgresModule],
  controllers: [PropertyController],
  providers: [
    PropertyService,
    {
      provide: PROPERTY_REPOSITORY,
      useClass: PostgresPropertyRepository,
    },
  ],
  exports: [PropertyService],
})
export class PropertyModule {}
