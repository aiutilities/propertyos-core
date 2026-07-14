import {
  Module,
} from '@nestjs/common';

import {
  PostgresModule,
} from '../../database/postgres/postgres.module';

import {
  AuditModule,
} from '../audit/audit.module';

import {
  AuthModule,
} from '../auth/auth.module';

import {
  EventBusModule,
} from '../eventbus/eventbus.module';

import {
  PluginModule,
} from '../plugin/plugin.module';

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
