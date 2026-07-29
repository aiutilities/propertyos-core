export interface MetaWhatsAppRecipientNormalization {
  status: 'READY' | 'BLOCKED';
  recipient?: string;
  error?: string;
}

export function normalizeMetaWhatsAppRecipient(
  rawRecipient: string,
): MetaWhatsAppRecipientNormalization {
  const compact = rawRecipient
    .trim()
    .replace(/[\s().-]/g, '');

  const international =
    compact.startsWith('00')
      ? compact.slice(2)
      : compact.startsWith('+')
        ? compact.slice(1)
        : compact;

  if (
    !/^[1-9]\d{7,14}$/.test(
      international,
    )
  ) {
    return {
      status: 'BLOCKED',
      error:
        'Meta WhatsApp recipient must use international E.164 format',
    };
  }

  return {
    status: 'READY',
    recipient: international,
  };
}
