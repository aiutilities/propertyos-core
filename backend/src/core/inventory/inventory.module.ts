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
  INVENTORY_STOCK_LEDGER_REPOSITORY,
} from './repositories/inventory-stock-ledger.repository';

import {
  PostgresInventoryRepository,
} from './repositories/postgres-inventory.repository';

import {
  PostgresInventoryStockLedgerRepository,
} from './repositories/postgres-inventory-stock-ledger.repository';

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
    PostgresInventoryStockLedgerRepository,

    {
      provide:
        INVENTORY_REPOSITORY,

      useExisting:
        PostgresInventoryRepository,
    },

    {
      provide:
        INVENTORY_STOCK_LEDGER_REPOSITORY,

      useExisting:
        PostgresInventoryStockLedgerRepository,
    },

    InventoryService,
    InventoryBootstrapService,
    InventorySearchProviderService,
  ],

  exports: [
    INVENTORY_REPOSITORY,
    INVENTORY_STOCK_LEDGER_REPOSITORY,
    PostgresInventoryRepository,
    PostgresInventoryStockLedgerRepository,
    InventoryService,
  ],
})
export class InventoryModule {}
