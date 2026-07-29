export interface InternationalPhoneNormalization {
  status: 'READY' | 'BLOCKED';
  recipient?: string;
  error?: string;
}

export function normalizeInternationalPhoneRecipient(
  rawRecipient: string,
): InternationalPhoneNormalization {
  const compact = rawRecipient
    .trim()
    .replace(/[\s().-]/g, '');

  const international =
    compact.startsWith('00')
      ? `+${compact.slice(2)}`
      : compact;

  if (
    !/^\+[1-9]\d{7,14}$/.test(
      international,
    )
  ) {
    return {
      status: 'BLOCKED',
      error:
        'Recipient must use international E.164 format',
    };
  }

  return {
    status: 'READY',
    recipient: international,
  };
}
