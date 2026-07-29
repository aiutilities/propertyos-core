export interface StripeConfiguration {
  secretKey: string;
  webhookSecret: string;

  endpoint?: string;
  timeoutMilliseconds?: number;
  webhookToleranceSeconds?: number;

  automaticPaymentMethods?: boolean;
  manualCapture?: boolean;
}

export interface StripeConfigurationResult {
  status: 'READY' | 'BLOCKED';

  secretKey?: string;
  webhookSecret?: string;

  endpoint: string;
  timeoutMilliseconds: number;
  webhookToleranceSeconds: number;

  automaticPaymentMethods: boolean;
  manualCapture: boolean;

  errors: readonly string[];
}

export interface StripePaymentIntentResponse {
  id: string;
  object?: string;

  amount: number;
  amount_capturable?: number;
  amount_received?: number;

  currency: string;
  status: string;

  client_secret?: string | null;
  latest_charge?: string | null;

  created?: number;
  metadata?: Record<string, string>;
}

export interface StripeRefundResponse {
  id: string;
  object?: string;

  amount: number;
  currency: string;

  payment_intent?: string | null;
  charge?: string | null;

  status?: string | null;
  created?: number;

  metadata?: Record<string, string>;
}

export interface StripeErrorResponse {
  error?: {
    type?: string;
    code?: string;
    message?: string;
    decline_code?: string;
    param?: string;
    request_log_url?: string;
  };
}

export interface StripeWebhookEnvelope {
  id?: string;
  type?: string;
  created?: number;

  data?: {
    object?: Record<string, unknown>;
  };
}
