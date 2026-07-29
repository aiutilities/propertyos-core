import {
  Controller,
  Get,
  Param,
} from '@nestjs/common';

import {
  PaymentEventStoreService,
} from '../services';

@Controller(
  'payments',
)
export class PaymentTimelineController {
  constructor(
    private readonly service:
      PaymentEventStoreService,
  ) {}

  @Get(
    ':paymentId/timeline',
  )
  async timeline(
    @Param('paymentId')
    paymentId: string,
  ) {
    return this.service.timeline(
      paymentId,
    );
  }
}
