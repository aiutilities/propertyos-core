import { Module } from '@nestjs/common';
import { PostgresModule } from '../../database/postgres/postgres.module';
import { IdentityController } from './controllers/identity.controller';
import { PostgresIdentityRepository } from './repositories/postgres-identity.repository';
import {
  IDENTITY_REPOSITORY,
  IdentityService,
} from './services/identity.service';

@Module({
  imports: [PostgresModule],
  controllers: [IdentityController],
  providers: [
    IdentityService,
    {
      provide: IDENTITY_REPOSITORY,
      useClass: PostgresIdentityRepository,
    },
  ],
  exports: [IdentityService],
})
export class IdentityModule {}
