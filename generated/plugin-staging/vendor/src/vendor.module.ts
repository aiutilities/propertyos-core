import {
  Module,
} from '@nestjs/common';

import {
  PostgresModule,
} from '@propertyos/core-contracts';

import {
  AuditModule,
} from '@propertyos/core-contracts';

import {
  AuthModule,
} from '@propertyos/core-contracts';

import {
  EventBusModule,
} from '@propertyos/core-contracts';

import {
  PluginModule,
} from '@propertyos/core-contracts';

import {
  VendorBootstrapService,
} from './bootstrap/vendor-bootstrap.service';

import {
  VendorController,
} from './controllers/vendor.controller';

import {
  VENDOR_REPOSITORY,
} from './repositories/vendor.repository';

import {
  PostgresVendorRepository,
} from './repositories/postgres-vendor.repository';

import {
  VendorService,
} from './services/vendor.service';

@Module({
  imports: [
    AuditModule,
    AuthModule,
    EventBusModule,
    PluginModule,
    PostgresModule,
  ],

  controllers: [
    VendorController,
  ],

  providers: [
    VendorBootstrapService,
    VendorService,
    {
      provide:
        VENDOR_REPOSITORY,
      useClass:
        PostgresVendorRepository,
    },
  ],

  exports: [
    VendorService,
  ],
})
export class VendorModule {}
