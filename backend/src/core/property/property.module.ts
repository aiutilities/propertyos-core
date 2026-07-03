import { Module } from '@nestjs/common';
import { PostgresModule } from '../../database/postgres/postgres.module';
import {
  PROPERTY_REPOSITORY,
  PropertyService,
} from './services/property.service';
import { PostgresPropertyRepository } from './repositories/postgres-property.repository';

@Module({
  imports: [PostgresModule],
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
