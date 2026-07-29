import {
  MetaWhatsAppCloudConfiguration,
  MetaWhatsAppCloudConfigurationResult,
} from './meta-whatsapp-cloud.types';

export const DEFAULT_META_WHATSAPP_TIMEOUT_MILLISECONDS =
  10_000;

export const MAX_META_WHATSAPP_TIMEOUT_MILLISECONDS =
  60_000;

function normalize(
  value: string,
): string | undefined {
  const result = value.trim();

  return result.length > 0
    ? result
    : undefined;
}

function resolveTimeout(
  value: number | undefined,
  errors: string[],
): number {
  if (value === undefined) {
    return DEFAULT_META_WHATSAPP_TIMEOUT_MILLISECONDS;
  }

  if (
    !Number.isInteger(value) ||
    value < 100 ||
    value >
      MAX_META_WHATSAPP_TIMEOUT_MILLISECONDS
  ) {
    errors.push(
      'Meta WhatsApp timeout must be an integer between 100 and 60000 milliseconds',
    );

    return DEFAULT_META_WHATSAPP_TIMEOUT_MILLISECONDS;
  }

  return value;
}

export function resolveMetaWhatsAppCloudConfiguration(
  input: MetaWhatsAppCloudConfiguration,
): MetaWhatsAppCloudConfigurationResult {
  const errors: string[] = [];

  const graphApiVersion =
    normalize(input.graphApiVersion);

  if (
    !graphApiVersion ||
    !/^v\d+\.\d+$/.test(
      graphApiVersion,
    )
  ) {
    errors.push(
      'Meta Graph API version must use the format vNN.N',
    );
  }

  const phoneNumberId =
    normalize(input.phoneNumberId);

  if (
    !phoneNumberId ||
    !/^\d{5,30}$/.test(
      phoneNumberId,
    )
  ) {
    errors.push(
      'Meta WhatsApp phone number ID must contain 5 to 30 digits',
    );
  }

  const accessToken =
    normalize(input.accessToken);

  if (!accessToken) {
    errors.push(
      'Meta WhatsApp access token is required',
    );
  } else if (
    accessToken.length < 20
  ) {
    errors.push(
      'Meta WhatsApp access token must contain at least 20 characters',
    );
  }

  const timeoutMilliseconds =
    resolveTimeout(
      input.timeoutMilliseconds,
      errors,
    );

  const endpoint =
    graphApiVersion &&
    phoneNumberId
      ? `https://graph.facebook.com/${graphApiVersion}/${phoneNumberId}/messages`
      : undefined;

  return {
    status:
      errors.length === 0
        ? 'READY'
        : 'BLOCKED',
    graphApiVersion,
    phoneNumberId,
    accessToken,
    timeoutMilliseconds,
    previewUrl:
      input.previewUrl ?? false,
    endpoint,
    errors,
  };
}
