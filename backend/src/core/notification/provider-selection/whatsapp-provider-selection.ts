import {
  CommunicationProviderSelectionInput,
} from './communication-provider-selection.types';

import {
  WhatsAppProviderMode,
  WhatsAppProviderSelection,
} from './whatsapp-provider-selection.types';

function normalizeProvider(
  value?: string,
): string {
  return value
    ?.trim()
    .toLowerCase() ?? '';
}

export function resolveWhatsAppCommunicationProvider(
  input:
    CommunicationProviderSelectionInput,
): WhatsAppProviderSelection {
  const errors: string[] = [];

  const configured =
    normalizeProvider(
      input.configuredProvider,
    );

  let provider:
    WhatsAppProviderMode =
      'DISABLED';

  if (!configured) {
    provider =
      input.environmentClass ===
        'PRODUCTION'
        ? 'DISABLED'
        : 'MOCK';
  } else if (
    configured === 'mock'
  ) {
    provider = 'MOCK';
  } else if (
    configured === 'webhook' ||
    configured === 'wppconnect'
  ) {
    provider = 'WEBHOOK';
  } else if (
    configured === 'meta-cloud' ||
    configured === 'meta_cloud' ||
    configured === 'meta'
  ) {
    provider =
      'META_CLOUD';
  } else if (
    configured === 'disabled'
  ) {
    provider =
      'DISABLED';
  } else {
    errors.push(
      `Unsupported WhatsApp provider: ${configured}`,
    );
  }

  if (
    input.environmentClass ===
      'PRODUCTION' &&
    provider === 'MOCK'
  ) {
    errors.push(
      'Mock WhatsApp delivery is forbidden in production',
    );
  }

  const status =
    errors.length === 0
      ? 'READY' as const
      : 'BLOCKED' as const;

  return {
    status,

    channel:
      'WHATSAPP',

    provider,

    enabled:
      status === 'READY' &&
      provider !== 'DISABLED',

    realDeliveryConfigured:
      status === 'READY' &&
      (
        provider ===
          'WEBHOOK' ||
        provider ===
          'META_CLOUD'
      ),

    mockAllowed:
      status === 'READY' &&
      provider === 'MOCK' &&
      input.environmentClass !==
        'PRODUCTION',

    errors,
  };
}
