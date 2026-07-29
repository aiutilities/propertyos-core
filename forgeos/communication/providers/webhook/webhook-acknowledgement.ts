import {
  WebhookAcknowledgement,
} from './webhook-provider.types';

export function isWebhookAcknowledgement(
  value: unknown,
): value is WebhookAcknowledgement {
  if (
    typeof value !== 'object' ||
    value === null
  ) {
    return false;
  }

  const candidate =
    value as Record<
      string,
      unknown
    >;

  return (
    candidate.success === true &&
    typeof candidate.messageId ===
      'string' &&
    candidate.messageId
      .trim()
      .length > 0 &&
    candidate.messageId
      .trim()
      .length <= 200
  );
}
