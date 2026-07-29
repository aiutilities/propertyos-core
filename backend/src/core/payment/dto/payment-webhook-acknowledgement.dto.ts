export interface PaymentWebhookAcknowledgementDto {
  received:
    true;

  duplicate:
    boolean;

  providerName:
    string;

  eventId?:
    string;

  eventType?:
    string;

  handledBy:
    readonly string[];
}
