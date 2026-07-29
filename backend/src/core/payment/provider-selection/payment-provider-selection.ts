import {
  PaymentProviderSelection,
  PaymentProviderSelectionInput,
  PropertyOSPaymentProviderMode,
} from './payment-provider-selection.types';

function normalizeProvider(
  value:
    string | undefined,
): string {
  return value
    ?.trim()
    .toLowerCase() ?? '';
}

export function resolvePaymentProviderSelection(
  input:
    PaymentProviderSelectionInput,
): PaymentProviderSelection {
  const errors:
    string[] = [];

  const configuredProvider =
    normalizeProvider(
      input.configuredProvider,
    );

  let provider:
    PropertyOSPaymentProviderMode =
      'DISABLED';

  if (
    !configuredProvider ||
    configuredProvider ===
      'disabled'
  ) {
    provider =
      'DISABLED';
  } else if (
    configuredProvider ===
      'razorpay'
  ) {
    provider =
      'RAZORPAY';
  } else if (
    configuredProvider ===
      'stripe'
  ) {
    provider =
      'STRIPE';
  } else {
    errors.push(
      `Unsupported payment provider: ${configuredProvider}`,
    );
  }

  const status =
    errors.length === 0
      ? 'READY' as const
      : 'BLOCKED' as const;

  return {
    status,

    provider,

    enabled:
      status === 'READY' &&
      provider !==
        'DISABLED',

    realPaymentConfigured:
      status === 'READY' &&
      (
        provider ===
          'RAZORPAY' ||
        provider ===
          'STRIPE'
      ),

    environmentClass:
      input.environmentClass,

    errors,
  };
}
