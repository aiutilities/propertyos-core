import {
  MetaWhatsAppCloudSuccessResponse,
} from './meta-whatsapp-cloud.types';

export function isMetaWhatsAppCloudSuccessResponse(
  value: unknown,
): value is MetaWhatsAppCloudSuccessResponse {
  if (
    typeof value !== 'object' ||
    value === null
  ) {
    return false;
  }

  const candidate =
    value as Record<string, unknown>;

  if (
    !Array.isArray(
      candidate.messages,
    ) ||
    candidate.messages.length === 0
  ) {
    return false;
  }

  const firstMessage =
    candidate.messages[0];

  if (
    typeof firstMessage !== 'object' ||
    firstMessage === null
  ) {
    return false;
  }

  const id =
    (
      firstMessage as
        Record<string, unknown>
    ).id;

  return (
    typeof id === 'string' &&
    id.trim().length > 0 &&
    id.trim().length <= 500
  );
}
