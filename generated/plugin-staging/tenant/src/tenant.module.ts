import { Module } from '@nestjs/common';

import { DatabaseModule } from '@propertyos/core-contracts';
import { IdentityModule } from '@propertyos/core-contracts';
import { EventBusModule } from '@propertyos/core-contracts';
import { SearchModule } from '@propertyos/core-contracts';
import { PluginModule } from '@propertyos/core-contracts';
import { TenantController } from './controllers/tenant.controller';
import { TENANT_REPOSITORY } from './repositories/tenant-repository.interface';
import { PostgresTenantRepository } from './repositories/postgres-tenant.repository';
import { TenantService } from './services/tenant.service';
import { TenantDashboardContributorService } from './services/tenant-dashboard-contributor.service';
import { TenantSearchProviderService } from './tenant-search-provider.service';

@Module({
  imports: [
    DatabaseModule,
    IdentityModule,
    EventBusModule,
    SearchModule,
    PluginModule,
  ],
  controllers: [TenantController],
  providers: [
    TenantService,
    TenantSearchProviderService,
    TenantDashboardContributorService,
    {
      provide: TENANT_REPOSITORY,
      useClass: PostgresTenantRepository,
    },
  ],
  exports: [TenantService],
})
export class TenantModule {}
