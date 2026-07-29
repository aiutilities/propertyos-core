import {
  Module,
} from '@nestjs/common';

import {
  PostgresModule,
} from '../../database/postgres';

import {
  EventBusModule,
} from '../eventbus/eventbus.module';

import {
  PropertyOSPaymentEventPublisherAdapter,
  PropertyOSPaymentLoggerAdapter,
  PropertyOSPaymentReconciliationLocalStoreAdapter,
  PropertyOSPaymentReconciliationReportStoreAdapter,
  PropertyOSPaymentReconciliationStateUpdaterAdapter,
  PropertyOSPaymentStateStoreAdapter,
} from './adapters/forgeos';

import {
  PaymentReconciliationRepository,
  PaymentTransactionRepository,
  PostgresPaymentReconciliationRepository,
  PostgresPaymentTransactionRepository,
} from './repositories';

import {
  PaymentRuntimeService,
} from './runtime';

@Module({
  imports: [
    EventBusModule,
    PostgresModule,
  ],

  providers: [
    {
      provide:
        PaymentTransactionRepository,

      useClass:
        PostgresPaymentTransactionRepository,
    },

    {
      provide:
        PaymentReconciliationRepository,

      useClass:
        PostgresPaymentReconciliationRepository,
    },

    PropertyOSPaymentEventPublisherAdapter,
    PropertyOSPaymentLoggerAdapter,
    PropertyOSPaymentStateStoreAdapter,

    PropertyOSPaymentReconciliationLocalStoreAdapter,
    PropertyOSPaymentReconciliationReportStoreAdapter,
    PropertyOSPaymentReconciliationStateUpdaterAdapter,

    PaymentRuntimeService,
  ],

  exports: [
    PaymentRuntimeService,
    PaymentTransactionRepository,
    PaymentReconciliationRepository,

    PropertyOSPaymentReconciliationLocalStoreAdapter,
    PropertyOSPaymentReconciliationReportStoreAdapter,
    PropertyOSPaymentReconciliationStateUpdaterAdapter,
  ],
})
export class PaymentModule {}
