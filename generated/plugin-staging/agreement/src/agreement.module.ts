import { Module } from '@nestjs/common';

import { PostgresModule } from '@propertyos/core-contracts';
import { IdentityModule } from '@propertyos/core-contracts';
import { EventBusModule } from '@propertyos/core-contracts';
import { SearchModule } from '@propertyos/core-contracts';
import { PluginModule } from '@propertyos/core-contracts';

import { AgreementController } from './controllers/agreement.controller';
import {
  AGREEMENT_REPOSITORY,
  AgreementService,
} from './services/agreement.service';
import { PostgresAgreementRepository } from './repositories/postgres-agreement.repository';
import { AgreementSearchProviderService } from './agreement-search-provider.service';
import { AgreementDashboardContributorService } from './services/agreement-dashboard-contributor.service';

@Module({
  imports: [
    PostgresModule,
    IdentityModule,
    EventBusModule,
    SearchModule,
    PluginModule,
  ],
  controllers: [AgreementController],
  providers: [
    AgreementService,
    AgreementSearchProviderService,
    AgreementDashboardContributorService,
    {
      provide: AGREEMENT_REPOSITORY,
      useClass: PostgresAgreementRepository,
    },
  ],
  exports: [AgreementService],
})
export class AgreementModule {}
