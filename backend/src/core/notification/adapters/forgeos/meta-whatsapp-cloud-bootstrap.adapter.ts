import {
  MetaWhatsAppCloudProvider,
} from '@forgeos/communication';

export interface PropertyOSMetaWhatsAppEnvironment {
  graphApiVersion?: string;
  phoneNumberId?: string;
  accessToken?: string;
  timeoutMilliseconds?: string;
  previewUrl?: string;
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

export function createPropertyOSMetaWhatsAppCloudProvider(
  environment:
    PropertyOSMetaWhatsAppEnvironment,
): MetaWhatsAppCloudProvider {
  return new MetaWhatsAppCloudProvider({
    graphApiVersion:
      environment.graphApiVersion ?? '',
    phoneNumberId:
      environment.phoneNumberId ?? '',
    accessToken:
      environment.accessToken ?? '',
    timeoutMilliseconds:
      parseTimeout(
        environment.timeoutMilliseconds,
      ),
    previewUrl:
      parseBoolean(
        environment.previewUrl,
      ),
  });
}
