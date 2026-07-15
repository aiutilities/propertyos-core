import {
  Module,
} from '@nestjs/common';

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
  SearchModule,
} from '../search/search.module';

import {
  PostgresModule,
} from '../../database/postgres/postgres.module';

import {
  InventoryBootstrapService,
} from './bootstrap/inventory-bootstrap.service';

import {
  InventoryController,
} from './controllers/inventory.controller';

import {
  InventorySearchProviderService,
} from './inventory-search-provider.service';

import {
  INVENTORY_REPOSITORY,
} from './repositories/inventory.repository';

import {
  PostgresInventoryRepository,
} from './repositories/postgres-inventory.repository';

import {
  InventoryService,
} from './services/inventory.service';

@Module({
  imports: [
    PostgresModule,
    AuthModule,
    AuditModule,
    EventBusModule,
    PluginModule,
    SearchModule,
  ],

  controllers: [
    InventoryController,
  ],

  providers: [
    PostgresInventoryRepository,

    {
      provide:
        INVENTORY_REPOSITORY,

      useExisting:
        PostgresInventoryRepository,
    },

    InventoryService,
    InventoryBootstrapService,
    InventorySearchProviderService,
  ],

  exports: [
    INVENTORY_REPOSITORY,
    PostgresInventoryRepository,
    InventoryService,
  ],
})
export class InventoryModule {}
