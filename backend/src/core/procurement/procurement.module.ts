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
  PROCUREMENT_QUOTATION_REPOSITORY,
} from './repositories/procurement-quotation.repository';

import {
  PROCUREMENT_RFQ_REPOSITORY,
} from './repositories/procurement-rfq.repository';

import {
  PURCHASE_REQUEST_REPOSITORY,
} from './repositories/purchase-request.repository';

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
    ProcurementQuotationComparisonController,
    ProcurementQuotationController,
    ProcurementRfqController,
    PurchaseRequestController,
  ],

  providers: [
    ProcurementBootstrapService,
    ProcurementQuotationComparisonService,
    ProcurementQuotationService,
    ProcurementRfqService,
    PurchaseRequestService,

    PostgresProcurementQuotationRepository,
    PostgresProcurementRfqRepository,
    PostgresPurchaseRequestRepository,

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
    ProcurementQuotationComparisonService,
    ProcurementQuotationService,
    ProcurementRfqService,
    PurchaseRequestService,
  ],
})
export class ProcurementModule {}
