import {
  CommunicationProviderSelectionInput,
} from './communication-provider-selection.types';

import {
  EmailProviderMode,
  EmailProviderSelection,
} from './email-provider-selection.types';

function normalizeProvider(
  value?: string,
): string {
  return value
    ?.trim()
    .toLowerCase() ?? '';
}

export function resolveEmailCommunicationProvider(
  input:
    CommunicationProviderSelectionInput,
): EmailProviderSelection {
  const errors: string[] = [];

  const configured =
    normalizeProvider(
      input.configuredProvider,
    );

  let provider:
    EmailProviderMode =
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
      'mailersend'
  ) {
    provider =
      'MAILERSEND';
  } else {
    errors.push(
      `Unsupported email provider: ${configured}`,
    );
  }

  const status =
    errors.length === 0
      ? 'READY' as const
      : 'BLOCKED' as const;

  return {
    status,

    channel:
      'EMAIL',

    provider,

    enabled:
      status === 'READY' &&
      provider !== 'DISABLED',

    realDeliveryConfigured:
      status === 'READY' &&
      provider ===
        'MAILERSEND',

    errors,
  };
}
