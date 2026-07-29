export interface Fast2SmsRecipientNormalization {
  status: 'READY' | 'BLOCKED';
  recipient?: string;
  error?: string;
}

export function normalizeFast2SmsRecipient(
  rawRecipient: string,
): Fast2SmsRecipientNormalization {
  const compact = rawRecipient
    .trim()
    .replace(/[\s().-]/g, '');

  let recipient = compact;

  if (
    recipient.startsWith('+91')
  ) {
    recipient =
      recipient.slice(3);
  } else if (
    recipient.startsWith('0091')
  ) {
    recipient =
      recipient.slice(4);
  } else if (
    recipient.startsWith('91') &&
    recipient.length === 12
  ) {
    recipient =
      recipient.slice(2);
  }

  if (
    !/^[6-9]\d{9}$/.test(
      recipient,
    )
  ) {
    return {
      status: 'BLOCKED',
      error:
        'Fast2SMS recipient must be a valid Indian 10-digit mobile number',
    };
  }

  return {
    status: 'READY',
    recipient,
  };
}
