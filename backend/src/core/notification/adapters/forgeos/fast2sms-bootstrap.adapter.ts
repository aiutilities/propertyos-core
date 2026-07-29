import {
  Fast2SmsProvider,
} from '@forgeos/communication';

export interface PropertyOSFast2SmsEnvironment {
  apiKey?: string;
  senderId?: string;
  timeoutMilliseconds?: string;
  includeSmsDetails?: string;
}

function parseTimeout(
  value?: string,
): number | undefined {
  if (
    value === undefined ||
    value.trim() === ''
  ) {
    return undefined;
  }

  return Number(
    value.trim(),
  );
}

function parseBoolean(
  value?: string,
): boolean | undefined {
  const normalized =
    value?.trim().toLowerCase();

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

export function createPropertyOSFast2SmsProvider(
  environment:
    PropertyOSFast2SmsEnvironment,
): Fast2SmsProvider {
  return new Fast2SmsProvider({
    apiKey:
      environment.apiKey ?? '',

    senderId:
      environment.senderId ?? '',

    timeoutMilliseconds:
      parseTimeout(
        environment.timeoutMilliseconds,
      ),

    includeSmsDetails:
      parseBoolean(
        environment.includeSmsDetails,
      ),
  });
}
