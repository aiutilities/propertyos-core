export const DELIVERY_STATUSES = [
  'QUEUED',
  'PROCESSING',
  'SENT',
  'DELIVERED',
  'READ',
  'FAILED',
  'RETRY_SCHEDULED',
  'CANCELLED',
] as const;

export type DeliveryStatus =
  (typeof DELIVERY_STATUSES)[number];

export const TERMINAL_DELIVERY_STATUSES = [
  'DELIVERED',
  'READ',
  'FAILED',
  'CANCELLED',
] as const;

export type TerminalDeliveryStatus =
  (typeof TERMINAL_DELIVERY_STATUSES)[number];
