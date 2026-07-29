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
  PaymentProviderEventRepository,
  PaymentReconciliationRepository,
  PaymentTransactionRepository,
  PostgresPaymentProviderEventRepository,
  PostgresPaymentReconciliationRepository,
  PostgresPaymentTransactionRepository,
} from './repositories';

import {
  PaymentRuntimeService,
} from './runtime';

import {
  PaymentTimelineController,
} from './controllers';

import {
  PaymentEventStoreService,
} from './services';

@Module({
  imports: [
    EventBusModule,
    PostgresModule,
  ],


  controllers: [
    PaymentTimelineController,
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

    {
      provide:
        PaymentProviderEventRepository,

      useClass:
        PostgresPaymentProviderEventRepository,
    },

    PropertyOSPaymentEventPublisherAdapter,
    PropertyOSPaymentLoggerAdapter,
    PropertyOSPaymentStateStoreAdapter,

    PropertyOSPaymentReconciliationLocalStoreAdapter,
    PropertyOSPaymentReconciliationReportStoreAdapter,
    PropertyOSPaymentReconciliationStateUpdaterAdapter,

    PaymentEventStoreService,
    PaymentRuntimeService,
  ],

  exports: [
    PaymentRuntimeService,
    PaymentEventStoreService,
    PaymentTransactionRepository,
    PaymentProviderEventRepository,
    PaymentReconciliationRepository,

    PropertyOSPaymentReconciliationLocalStoreAdapter,
    PropertyOSPaymentReconciliationReportStoreAdapter,
    PropertyOSPaymentReconciliationStateUpdaterAdapter,
  ],
})
export class PaymentModule {}
