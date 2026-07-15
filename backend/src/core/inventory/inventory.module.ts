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
  InventoryStockAdjustmentController,
} from './controllers/inventory-stock-adjustment.controller';

import {
  InventoryStockTransferController,
} from './controllers/inventory-stock-transfer.controller';

import {
  InventoryStockReservationController,
} from './controllers/inventory-stock-reservation.controller';

import {
  InventoryCycleCountController,
} from './controllers/inventory-cycle-count.controller';

import {
  InventoryMaterialIssueController,
} from './controllers/inventory-material-issue.controller';

import {
  InventoryMaterialReturnController,
} from './controllers/inventory-material-return.controller';



import {
  InventorySearchProviderService,
} from './inventory-search-provider.service';

import {
  INVENTORY_BATCH_REPOSITORY,
} from './repositories/inventory-batch.repository';

import {
  INVENTORY_REPOSITORY,
} from './repositories/inventory.repository';

import {
  INVENTORY_STOCK_LEDGER_REPOSITORY,
} from './repositories/inventory-stock-ledger.repository';

import {
  PostgresInventoryBatchRepository,
} from './repositories/postgres-inventory-batch.repository';

import {
  PostgresInventoryRepository,
} from './repositories/postgres-inventory.repository';

import {
  PostgresInventoryStockLedgerRepository,
} from './repositories/postgres-inventory-stock-ledger.repository';

import {
  InventoryBatchService,
} from './services/inventory-batch.service';

import {
  InventoryService,
} from './services/inventory.service';

import {
  InventoryStockAdjustmentService,
} from './services/inventory-stock-adjustment.service';

import {
  InventoryStockTransferService,
} from './services/inventory-stock-transfer.service';

import {
  InventoryStockReservationService,
} from './services/inventory-stock-reservation.service';

import {
  InventoryCycleCountService,
} from './services/inventory-cycle-count.service';

import {
  InventoryMaterialIssueService,
} from './services/inventory-material-issue.service';

import {
  InventoryMaterialReturnService,
} from './services/inventory-material-return.service';



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
    InventoryStockAdjustmentController,
    InventoryStockTransferController,
    InventoryStockReservationController,
    InventoryCycleCountController,
    InventoryMaterialIssueController,
    InventoryMaterialReturnController,
  ],

  providers: [
    PostgresInventoryRepository,
    PostgresInventoryBatchRepository,
    PostgresInventoryStockLedgerRepository,

    {
      provide:
        INVENTORY_REPOSITORY,

      useExisting:
        PostgresInventoryRepository,
    },

    {
      provide:
        INVENTORY_BATCH_REPOSITORY,

      useExisting:
        PostgresInventoryBatchRepository,
    },

    {
      provide:
        INVENTORY_STOCK_LEDGER_REPOSITORY,

      useExisting:
        PostgresInventoryStockLedgerRepository,
    },

    InventoryService,
    InventoryBatchService,
    InventoryStockAdjustmentService,
    InventoryStockTransferService,
    InventoryStockReservationService,
    InventoryCycleCountService,
    InventoryMaterialIssueService,
    InventoryMaterialReturnService,
    InventoryBootstrapService,
    InventorySearchProviderService,
  ],

  exports: [
    INVENTORY_REPOSITORY,
    INVENTORY_BATCH_REPOSITORY,
    INVENTORY_STOCK_LEDGER_REPOSITORY,
    PostgresInventoryRepository,
    PostgresInventoryBatchRepository,
    PostgresInventoryStockLedgerRepository,
    InventoryService,
    InventoryBatchService,
    InventoryStockAdjustmentService,
  ],
})
export class InventoryModule {}
