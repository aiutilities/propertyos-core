export interface RazorpayConfiguration {
  keyId: string;
  keySecret: string;
  webhookSecret: string;

  endpoint?: string;
  timeoutMilliseconds?: number;
}

export interface RazorpayConfigurationResult {
  status: 'READY' | 'BLOCKED';

  keyId?: string;
  keySecret?: string;
  webhookSecret?: string;

  endpoint: string;
  timeoutMilliseconds: number;

  errors: readonly string[];
}

export interface RazorpayOrderResponse {
  id: string;
  entity?: string;
  amount: number;
  amount_paid?: number;
  amount_due?: number;
  currency: string;
  receipt?: string | null;
  status: string;
  attempts?: number;
  created_at?: number;
  notes?: Record<string, unknown>;
}

export interface RazorpayPaymentResponse {
  id: string;
  entity?: string;
  amount: number;
  currency: string;
  status: string;
  order_id?: string | null;
  captured?: boolean;
  created_at?: number;
  notes?: Record<string, unknown>;
}

export interface RazorpayRefundResponse {
  id: string;
  entity?: string;
  amount: number;
  currency: string;
  payment_id: string;
  status?: string;
  created_at?: number;
  receipt?: string | null;
  notes?: Record<string, unknown>;
}

export interface RazorpayErrorResponse {
  error?: {
    code?: string;
    description?: string;
    source?: string;
    step?: string;
    reason?: string;
    metadata?: Record<string, unknown>;
  };
}
