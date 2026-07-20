import { WhatsAppEnvironmentClass } from './whatsapp-provider-selection';

export const DEFAULT_WHATSAPP_WEBHOOK_TIMEOUT_MS =
  10_000;

export const MAX_WHATSAPP_WEBHOOK_TIMEOUT_MS =
  60_000;

export interface WhatsAppWebhookConfigurationInput {
  environmentClass: WhatsAppEnvironmentClass;
  webhookUrl?: string;
  webhookToken?: string;
  timeoutMs?: string | number;
}

export interface WhatsAppWebhookConfiguration {
  status: 'READY' | 'BLOCKED';
  scope:
    'PROPERTYOS_WHATSAPP_WEBHOOK_CONFIGURATION';
  environmentClass: WhatsAppEnvironmentClass;
  webhookUrl?: string;
  webhookToken?: string;
  timeoutMs: number;
  errors: string[];
}

function normalizedOptionalValue(
  value?: string,
): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function resolveTimeout(
  value: string | number | undefined,
  errors: string[],
): number {
  if (
    value === undefined ||
    (typeof value === 'string' &&
      value.trim() === '')
  ) {
    return DEFAULT_WHATSAPP_WEBHOOK_TIMEOUT_MS;
  }

  const parsed =
    typeof value === 'number'
      ? value
      : Number(value.trim());

  if (
    !Number.isInteger(parsed) ||
    parsed < 100 ||
    parsed >
      MAX_WHATSAPP_WEBHOOK_TIMEOUT_MS
  ) {
    errors.push(
      'WhatsApp webhook timeout must be an integer between 100 and 60000 milliseconds',
    );

    return DEFAULT_WHATSAPP_WEBHOOK_TIMEOUT_MS;
  }

  return parsed;
}

function validateWebhookUrl(
  rawUrl: string | undefined,
  environmentClass:
    WhatsAppEnvironmentClass,
  errors: string[],
): string | undefined {
  if (!rawUrl) {
    errors.push(
      'WhatsApp webhook URL is required',
    );
    return undefined;
  }

  let parsed: URL;

  try {
    parsed = new URL(rawUrl);
  } catch {
    errors.push(
      'WhatsApp webhook URL must be a valid absolute URL',
    );
    return undefined;
  }

  if (
    parsed.protocol !== 'https:' &&
    parsed.protocol !== 'http:'
  ) {
    errors.push(
      'WhatsApp webhook URL must use HTTP or HTTPS',
    );
  }

  if (
    environmentClass === 'PRODUCTION' &&
    parsed.protocol !== 'https:'
  ) {
    errors.push(
      'WhatsApp webhook URL must use HTTPS in production',
    );
  }

  if (parsed.username || parsed.password) {
    errors.push(
      'WhatsApp webhook URL must not contain credentials',
    );
  }

  if (parsed.hash) {
    errors.push(
      'WhatsApp webhook URL must not contain a fragment',
    );
  }

  return parsed.toString();
}

export function resolveWhatsAppWebhookConfiguration(
  input: WhatsAppWebhookConfigurationInput,
): WhatsAppWebhookConfiguration {
  const errors: string[] = [];

  const webhookUrl = validateWebhookUrl(
    normalizedOptionalValue(
      input.webhookUrl,
    ),
    input.environmentClass,
    errors,
  );

  const webhookToken =
    normalizedOptionalValue(
      input.webhookToken,
    );

  if (!webhookToken) {
    errors.push(
      'WhatsApp webhook token is required',
    );
  } else if (webhookToken.length < 32) {
    errors.push(
      'WhatsApp webhook token must contain at least 32 characters',
    );
  }

  const timeoutMs = resolveTimeout(
    input.timeoutMs,
    errors,
  );

  return {
    status:
      errors.length === 0
        ? 'READY'
        : 'BLOCKED',
    scope:
      'PROPERTYOS_WHATSAPP_WEBHOOK_CONFIGURATION',
    environmentClass:
      input.environmentClass,
    webhookUrl,
    webhookToken,
    timeoutMs,
    errors,
  };
}
