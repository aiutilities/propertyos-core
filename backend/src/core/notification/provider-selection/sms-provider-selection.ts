import {
  CommunicationProviderSelectionInput,
} from './communication-provider-selection.types';

import {
  SmsProviderMode,
  SmsProviderSelection,
} from './sms-provider-selection.types';

function normalizeProvider(
  value?: string,
): string {
  return value
    ?.trim()
    .toLowerCase() ?? '';
}

export function resolveSmsCommunicationProvider(
  input:
    CommunicationProviderSelectionInput,
): SmsProviderSelection {
  const errors: string[] = [];

  const configured =
    normalizeProvider(
      input.configuredProvider,
    );

  let provider:
    SmsProviderMode =
      'DISABLED';

  if (
    !configured ||
    configured ===
      'disabled'
  ) {
    provider =
      'DISABLED';
  } else if (
    configured ===
      'fast2sms'
  ) {
    provider =
      'FAST2SMS';
  } else {
    errors.push(
      `Unsupported SMS provider: ${configured}`,
    );
  }

  const status =
    errors.length === 0
      ? 'READY' as const
      : 'BLOCKED' as const;

  return {
    status,

    channel:
      'SMS',

    provider,

    enabled:
      status === 'READY' &&
      provider !== 'DISABLED',

    realDeliveryConfigured:
      status === 'READY' &&
      provider ===
        'FAST2SMS',

    errors,
  };
}
