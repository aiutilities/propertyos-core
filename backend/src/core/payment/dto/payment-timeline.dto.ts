export interface PaymentTimelineItemDto {
  id: string;

  providerName: string;

  providerEventId: string;

  eventType: string;

  occurredAt?: Date;

  receivedAt: Date;

  createdAt: Date;

  payload:
    Record<string, unknown>;

  metadata:
    Record<string, unknown>;
}
