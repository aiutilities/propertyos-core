import { Module } from '@nestjs/common';

import { PostgresModule } from '../../database/postgres/postgres.module';
import { IdentityModule } from '../identity/identity.module';
import { AgreementController } from './controllers/agreement.controller';
import {
  AGREEMENT_REPOSITORY,
  AgreementService,
} from './services/agreement.service';
import { PostgresAgreementRepository } from './repositories/postgres-agreement.repository';

@Module({
  imports: [PostgresModule, IdentityModule],
  controllers: [AgreementController],
  providers: [
    AgreementService,
    {
      provide: AGREEMENT_REPOSITORY,
      useClass: PostgresAgreementRepository,
    },
  ],
  exports: [AgreementService],
})
export class AgreementModule {}
