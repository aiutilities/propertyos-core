import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module';
import { IdentityModule } from '../identity/identity.module';
import { EventBusModule } from '../eventbus/eventbus.module';
import { SearchModule } from '../search';
import { TenantController } from './controllers/tenant.controller';
import { TENANT_REPOSITORY } from './repositories/tenant-repository.interface';
import { PostgresTenantRepository } from './repositories/postgres-tenant.repository';
import { TenantService } from './services/tenant.service';
import { TenantSearchProviderService } from './tenant-search-provider.service';

@Module({
  imports: [DatabaseModule, IdentityModule, EventBusModule, SearchModule],
  controllers: [TenantController],
  providers: [
    TenantService,
    TenantSearchProviderService,
    {
      provide: TENANT_REPOSITORY,
      useClass: PostgresTenantRepository,
    },
  ],
  exports: [TenantService],
})
export class TenantModule {}
