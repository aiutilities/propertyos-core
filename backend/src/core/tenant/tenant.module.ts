import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module';
import { TenantController } from './controllers/tenant.controller';
import { TENANT_REPOSITORY } from './repositories/tenant-repository.interface';
import { PostgresTenantRepository } from './repositories/postgres-tenant.repository';
import { TenantService } from './services/tenant.service';

@Module({
  imports: [DatabaseModule],
  controllers: [TenantController],
  providers: [
    TenantService,
    {
      provide: TENANT_REPOSITORY,
      useClass: PostgresTenantRepository,
    },
  ],
  exports: [TenantService],
})
export class TenantModule {}
