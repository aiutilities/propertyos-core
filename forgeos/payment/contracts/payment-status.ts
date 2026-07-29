export const PAYMENT_STATUSES = [
  'CREATED',
  'REQUIRES_ACTION',
  'AUTHORIZED',
  'CAPTURED',
  'FAILED',
  'CANCELLED',
  'PARTIALLY_REFUNDED',
  'REFUNDED',
] as const;

export type PaymentStatus =
  (typeof PAYMENT_STATUSES)[number];

export const TERMINAL_PAYMENT_STATUSES = [
  'CAPTURED',
  'FAILED',
  'CANCELLED',
  'REFUNDED',
] as const;

export type TerminalPaymentStatus =
  (typeof TERMINAL_PAYMENT_STATUSES)[number];
