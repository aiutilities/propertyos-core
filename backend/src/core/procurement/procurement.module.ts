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
  ProcurementRfqController,
} from './controllers/procurement-rfq.controller';

import {
  PurchaseRequestController,
} from './controllers/purchase-request.controller';

import {
  PROCUREMENT_RFQ_REPOSITORY,
} from './repositories/procurement-rfq.repository';

import {
  PURCHASE_REQUEST_REPOSITORY,
} from './repositories/purchase-request.repository';

import {
  PostgresProcurementRfqRepository,
} from './repositories/postgres-procurement-rfq.repository';

import {
  PostgresPurchaseRequestRepository,
} from './repositories/postgres-purchase-request.repository';

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
    ProcurementRfqController,
    PurchaseRequestController,
  ],

  providers: [
    ProcurementBootstrapService,
    ProcurementRfqService,
    PurchaseRequestService,

    PostgresProcurementRfqRepository,
    PostgresPurchaseRequestRepository,

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
    ProcurementRfqService,
    PurchaseRequestService,
  ],
})
export class ProcurementModule {}
