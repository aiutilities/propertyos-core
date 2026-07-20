export type WhatsAppEnvironmentClass =
  | 'DEVELOPMENT'
  | 'TEST'
  | 'PRODUCTION';

export type WhatsAppProviderMode =
  | 'MOCK'
  | 'WEBHOOK'
  | 'DISABLED';

export interface WhatsAppProviderSelectionInput {
  environmentClass:
    WhatsAppEnvironmentClass;
  configuredProvider?: string;
}

export interface WhatsAppProviderSelection {
  status: 'READY' | 'BLOCKED';
  scope:
    'PROPERTYOS_WHATSAPP_PROVIDER_SELECTION';
  environmentClass:
    WhatsAppEnvironmentClass;
  mode: WhatsAppProviderMode;
  mockAllowed: boolean;
  realDeliveryConfigured: boolean;
  errors: string[];
}

function normalizedProvider(
  value?: string,
): string {
  return value?.trim().toLowerCase() ?? '';
}

export function resolveWhatsAppProviderSelection(
  input: WhatsAppProviderSelectionInput,
): WhatsAppProviderSelection {
  const errors: string[] = [];
  const configured =
    normalizedProvider(
      input.configuredProvider,
    );

  let mode: WhatsAppProviderMode =
    'DISABLED';

  if (!configured) {
    mode =
      input.environmentClass ===
        'PRODUCTION'
        ? 'DISABLED'
        : 'MOCK';
  } else if (configured === 'mock') {
    mode = 'MOCK';
  } else if (
    configured === 'webhook' ||
    configured === 'wppconnect'
  ) {
    mode = 'WEBHOOK';
  } else if (configured === 'disabled') {
    mode = 'DISABLED';
  } else {
    errors.push(
      `Unsupported WhatsApp provider: ${configured}`,
    );
  }

  if (
    input.environmentClass ===
      'PRODUCTION' &&
    mode === 'MOCK'
  ) {
    errors.push(
      'Mock WhatsApp delivery is forbidden in production',
    );
  }

  const status =
    errors.length === 0
      ? 'READY'
      : 'BLOCKED';

  return {
    status,
    scope:
      'PROPERTYOS_WHATSAPP_PROVIDER_SELECTION',
    environmentClass:
      input.environmentClass,
    mode,
    mockAllowed:
      status === 'READY' &&
      mode === 'MOCK' &&
      input.environmentClass !==
        'PRODUCTION',
    realDeliveryConfigured:
      status === 'READY' &&
      mode === 'WEBHOOK',
    errors,
  };
}

export function currentWhatsAppEnvironmentClass(
  nodeEnvironment?: string,
): WhatsAppEnvironmentClass {
  const normalized =
    nodeEnvironment
      ?.trim()
      .toLowerCase();

  if (normalized === 'production') {
    return 'PRODUCTION';
  }

  if (normalized === 'test') {
    return 'TEST';
  }

  return 'DEVELOPMENT';
}
