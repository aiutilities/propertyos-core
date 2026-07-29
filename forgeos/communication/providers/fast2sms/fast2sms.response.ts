import {
  Fast2SmsSuccessResponse,
} from './fast2sms.types';

export function isFast2SmsSuccessResponse(
  value: unknown,
): value is Fast2SmsSuccessResponse {
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
    candidate.return === true &&
    (
      candidate.request_id ===
        undefined ||
      (
        typeof candidate.request_id ===
          'string' &&
        candidate.request_id
          .trim()
          .length > 0
      )
    )
  );
}
