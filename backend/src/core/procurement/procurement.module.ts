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
  ProcurementBootstrapService,
} from './bootstrap/procurement-bootstrap.service';

import {
  PurchaseRequestController,
} from './controllers/purchase-request.controller';

import {
  PURCHASE_REQUEST_REPOSITORY,
} from './repositories/purchase-request.repository';

import {
  PostgresPurchaseRequestRepository,
} from './repositories/postgres-purchase-request.repository';

import {
  PurchaseRequestService,
} from './services/purchase-request.service';

@Module({
  imports: [
    AuthModule,
    AuditModule,
    EventBusModule,
  ],

  controllers: [
    PurchaseRequestController,
  ],

  providers: [
    PurchaseRequestService,
    ProcurementBootstrapService,
    PostgresPurchaseRequestRepository,
    {
      provide:
        PURCHASE_REQUEST_REPOSITORY,
      useExisting:
        PostgresPurchaseRequestRepository,
    },
  ],

  exports: [
    PurchaseRequestService,
  ],
})
export class ProcurementModule {}
