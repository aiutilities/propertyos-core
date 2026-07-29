import {
  PaymentMoney,
} from './money';

import {
  PaymentStatus,
} from './payment-status';

export interface PaymentProviderResult {
  success: boolean;

  providerName: string;

  providerOrderId?: string;
  providerPaymentId?: string;
  providerRefundId?: string;

  status:
    PaymentStatus;

  money?:
    PaymentMoney;

  clientSecret?: string;
  checkoutUrl?: string;

  errorCode?: string;
  errorMessage?: string;
  retryable?: boolean;

  createdAt?: string;
  completedAt?: string;

  metadata?: Record<string, unknown>;
}
