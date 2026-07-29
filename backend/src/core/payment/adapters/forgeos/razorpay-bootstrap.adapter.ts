import {
  RazorpayProvider,
} from '@forgeos/payment';

export interface PropertyOSRazorpayEnvironment {
  keyId?: string;
  keySecret?: string;
  webhookSecret?: string;

  endpoint?: string;

  timeoutMilliseconds?:
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

export function createPropertyOSRazorpayProvider(
  environment:
    PropertyOSRazorpayEnvironment,
): RazorpayProvider {
  return new RazorpayProvider({
    keyId:
      environment.keyId ?? '',

    keySecret:
      environment.keySecret ?? '',

    webhookSecret:
      environment.webhookSecret ?? '',

    endpoint:
      environment.endpoint,

    timeoutMilliseconds:
      parseInteger(
        environment
          .timeoutMilliseconds,
      ),
  });
}
