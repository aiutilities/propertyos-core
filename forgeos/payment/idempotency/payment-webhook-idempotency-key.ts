export function buildPaymentWebhookIdempotencyKey(
  providerName: string,
  eventId: string,
): string {
  const normalizedProvider =
    providerName
      .trim()
      .toLowerCase();

  const normalizedEventId =
    eventId.trim();

  if (!normalizedProvider) {
    throw new Error(
      'PAYMENT_WEBHOOK_PROVIDER_REQUIRED',
    );
  }

  if (!normalizedEventId) {
    throw new Error(
      'PAYMENT_WEBHOOK_EVENT_ID_REQUIRED',
    );
  }

  return (
    `${normalizedProvider}:` +
    normalizedEventId
  );
}
