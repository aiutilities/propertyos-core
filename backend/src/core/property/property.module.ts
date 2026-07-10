import { Module } from '@nestjs/common';
import { PostgresModule } from '../../database/postgres/postgres.module';
import { IdentityModule } from '../identity/identity.module';
import { SearchModule } from '../search';

import { PropertyController } from './controllers/property.controller';

import {
  PROPERTY_REPOSITORY,
  PropertyService,
} from './services/property.service';

import { PostgresPropertyRepository } from './repositories/postgres-property.repository';
import { PropertySearchProviderService } from './property-search-provider.service';

@Module({
  imports: [PostgresModule, IdentityModule, SearchModule],
  controllers: [PropertyController],
  providers: [
    PropertyService,
    PropertySearchProviderService,
    {
      provide: PROPERTY_REPOSITORY,
      useClass: PostgresPropertyRepository,
    },
  ],
  exports: [PropertyService],
})
export class PropertyModule {}
