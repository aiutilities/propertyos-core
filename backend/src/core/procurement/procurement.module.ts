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
  ProcurementBootstrapService,
} from './bootstrap/procurement-bootstrap.service';

import {
  ProcurementGoodsReceiptController,
} from './controllers/procurement-goods-receipt.controller';

import {
  ProcurementPurchaseOrderController,
} from './controllers/procurement-purchase-order.controller';

import {
  ProcurementQuotationComparisonController,
} from './controllers/procurement-quotation-comparison.controller';

import {
  ProcurementQuotationController,
} from './controllers/procurement-quotation.controller';

import {
  ProcurementRfqController,
} from './controllers/procurement-rfq.controller';

import {
  PurchaseRequestController,
} from './controllers/purchase-request.controller';

import {
  PROCUREMENT_GOODS_RECEIPT_REPOSITORY,
} from './repositories/procurement-goods-receipt.repository';

import {
  PROCUREMENT_PURCHASE_ORDER_REPOSITORY,
} from './repositories/procurement-purchase-order.repository';

import {
  PROCUREMENT_QUOTATION_REPOSITORY,
} from './repositories/procurement-quotation.repository';

import {
  PROCUREMENT_RFQ_REPOSITORY,
} from './repositories/procurement-rfq.repository';

import {
  PURCHASE_REQUEST_REPOSITORY,
} from './repositories/purchase-request.repository';

import {
  PostgresProcurementGoodsReceiptRepository,
} from './repositories/postgres-procurement-goods-receipt.repository';

import {
  PostgresProcurementPurchaseOrderRepository,
} from './repositories/postgres-procurement-purchase-order.repository';

import {
  PostgresProcurementQuotationRepository,
} from './repositories/postgres-procurement-quotation.repository';

import {
  PostgresProcurementRfqRepository,
} from './repositories/postgres-procurement-rfq.repository';

import {
  PostgresPurchaseRequestRepository,
} from './repositories/postgres-purchase-request.repository';

import {
  ProcurementGoodsReceiptService,
} from './services/procurement-goods-receipt.service';

import {
  ProcurementPurchaseOrderService,
} from './services/procurement-purchase-order.service';

import {
  ProcurementQuotationComparisonService,
} from './services/procurement-quotation-comparison.service';

import {
  ProcurementQuotationService,
} from './services/procurement-quotation.service';

import {
  ProcurementRfqService,
} from './services/procurement-rfq.service';

import {
  PurchaseRequestService,
} from './services/purchase-request.service';

@Module({
  imports: [
    AuditModule,
    AuthModule,
    EventBusModule,
    PluginModule,
    PostgresModule,
  ],

  controllers: [
    ProcurementGoodsReceiptController,
    ProcurementPurchaseOrderController,
    ProcurementQuotationComparisonController,
    ProcurementQuotationController,
    ProcurementRfqController,
    PurchaseRequestController,
  ],

  providers: [
    ProcurementBootstrapService,
    ProcurementGoodsReceiptService,
    ProcurementPurchaseOrderService,
    ProcurementQuotationComparisonService,
    ProcurementQuotationService,
    ProcurementRfqService,
    PurchaseRequestService,

    PostgresProcurementGoodsReceiptRepository,
    PostgresProcurementPurchaseOrderRepository,
    PostgresProcurementQuotationRepository,
    PostgresProcurementRfqRepository,
    PostgresPurchaseRequestRepository,

    {
      provide:
        PROCUREMENT_GOODS_RECEIPT_REPOSITORY,
      useExisting:
        PostgresProcurementGoodsReceiptRepository,
    },

    {
      provide:
        PROCUREMENT_PURCHASE_ORDER_REPOSITORY,
      useExisting:
        PostgresProcurementPurchaseOrderRepository,
    },

    {
      provide:
        PROCUREMENT_QUOTATION_REPOSITORY,
      useExisting:
        PostgresProcurementQuotationRepository,
    },

    {
      provide:
        PROCUREMENT_RFQ_REPOSITORY,
      useExisting:
        PostgresProcurementRfqRepository,
    },

    {
      provide:
        PURCHASE_REQUEST_REPOSITORY,
      useExisting:
        PostgresPurchaseRequestRepository,
    },
  ],

  exports: [
    ProcurementGoodsReceiptService,
    ProcurementPurchaseOrderService,
    ProcurementQuotationComparisonService,
    ProcurementQuotationService,
    ProcurementRfqService,
    PurchaseRequestService,
  ],
})
export class ProcurementModule {}
