import {
  Module,
} from '@nestjs/common';

import {
  EventBusModule,
} from '../eventbus/eventbus.module';

import {
  PropertyOSPaymentEventPublisherAdapter,
  PropertyOSPaymentLoggerAdapter,
} from './adapters/forgeos';

import {
  PaymentRuntimeService,
} from './runtime';

@Module({
  imports: [
    EventBusModule,
  ],

  providers: [
    PropertyOSPaymentEventPublisherAdapter,
    PropertyOSPaymentLoggerAdapter,
    PaymentRuntimeService,
  ],

  exports: [
    PaymentRuntimeService,
  ],
})
export class PaymentModule {}
