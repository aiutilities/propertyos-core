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
  PropertyOSPaymentStateStoreAdapter,
} from './adapters/forgeos';

import {
  PaymentTransactionRepository,
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

    PropertyOSPaymentEventPublisherAdapter,
    PropertyOSPaymentLoggerAdapter,
    PropertyOSPaymentStateStoreAdapter,
    PaymentRuntimeService,
  ],

  exports: [
    PaymentRuntimeService,
    PaymentTransactionRepository,
  ],
})
export class PaymentModule {}
