import {
  Module,
} from '@nestjs/common';

import {
  PostgresModule,
} from '../../database/postgres';

import {
  AuthModule,
} from '../auth/auth.module';

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
  PaymentController,
  PaymentTimelineController,
  PaymentWebhookController,
} from './controllers';

import {
  PaymentEventStoreService,
  PaymentService,
} from './services';

import {
  PropertyOSPaymentWebhookHandler,
} from './webhooks';

@Module({
  imports: [
    AuthModule,
    EventBusModule,
    PostgresModule,
  ],


  controllers: [
    PaymentController,
    PaymentTimelineController,
    PaymentWebhookController,
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
    PaymentService,
    PropertyOSPaymentWebhookHandler,
    PaymentRuntimeService,
  ],

  exports: [
    PaymentRuntimeService,
    PaymentEventStoreService,
    PaymentService,
    PaymentTransactionRepository,
    PaymentProviderEventRepository,
    PaymentReconciliationRepository,

    PropertyOSPaymentReconciliationLocalStoreAdapter,
    PropertyOSPaymentReconciliationReportStoreAdapter,
    PropertyOSPaymentReconciliationStateUpdaterAdapter,
  ],
})
export class PaymentModule {}
