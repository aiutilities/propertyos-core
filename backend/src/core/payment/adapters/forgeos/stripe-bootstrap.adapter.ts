import {
  StripeProvider,
} from '@forgeos/payment';

export interface PropertyOSStripeEnvironment {
  secretKey?: string;
  webhookSecret?: string;

  endpoint?: string;

  timeoutMilliseconds?:
    string;

  webhookToleranceSeconds?:
    string;

  automaticPaymentMethods?:
    string;

  manualCapture?:
    string;
}

function parseInteger(
  value:
    string | undefined,
): number | undefined {
  if (
    value === undefined ||
    value.trim() === ''
  ) {
    return undefined;
  }

  const parsed =
    Number(value);

  return Number.isFinite(
    parsed,
  )
    ? parsed
    : Number.NaN;
}

function parseBoolean(
  value:
    string | undefined,
): boolean | undefined {
  const normalized =
    value
      ?.trim()
      .toLowerCase();

  if (!normalized) {
    return undefined;
  }

  if (
    normalized === 'true' ||
    normalized === '1' ||
    normalized === 'yes'
  ) {
    return true;
  }

  if (
    normalized === 'false' ||
    normalized === '0' ||
    normalized === 'no'
  ) {
    return false;
  }

  return undefined;
}

export function createPropertyOSStripeProvider(
  environment:
    PropertyOSStripeEnvironment,
): StripeProvider {
  return new StripeProvider({
    secretKey:
      environment.secretKey ?? '',

    webhookSecret:
      environment.webhookSecret ?? '',

    endpoint:
      environment.endpoint,

    timeoutMilliseconds:
      parseInteger(
        environment
          .timeoutMilliseconds,
      ),

    webhookToleranceSeconds:
      parseInteger(
        environment
          .webhookToleranceSeconds,
      ),

    automaticPaymentMethods:
      parseBoolean(
        environment
          .automaticPaymentMethods,
      ),

    manualCapture:
      parseBoolean(
        environment
          .manualCapture,
      ),
  });
}
