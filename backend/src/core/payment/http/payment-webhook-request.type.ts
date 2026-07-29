import type {
  RawBodyRequest,
} from '@nestjs/common';

import type {
  Request,
} from 'express';

export type PaymentWebhookHttpRequest =
  RawBodyRequest<Request> & {
    requestId?:
      string;
  };
