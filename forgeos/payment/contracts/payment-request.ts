import {
  PaymentCustomer,
} from './payment-customer';

import {
  PaymentMoney,
} from './money';

export interface CreatePaymentRequest {
  id?: string;

  idempotencyKey: string;

  money:
    PaymentMoney;

  description?: string;

  customer?:
    PaymentCustomer;

  receiptReference?: string;

  returnUrl?: string;

  source: string;
  sourceReference?: string;

  metadata?: Record<string, unknown>;
}

export interface CapturePaymentRequest {
  providerPaymentId: string;

  money?:
    PaymentMoney;

  idempotencyKey:
    string;

  metadata?: Record<string, unknown>;
}

export interface RefundPaymentRequest {
  providerPaymentId: string;

  money?:
    PaymentMoney;

  reason?: string;

  idempotencyKey:
    string;

  metadata?: Record<string, unknown>;
}
