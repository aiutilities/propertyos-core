import {
  currentCommunicationEnvironmentClass,
  resolveWhatsAppCommunicationProvider,
} from '../provider-selection';

export type WhatsAppEnvironmentClass =
  | 'DEVELOPMENT'
  | 'TEST'
  | 'PRODUCTION';

export type WhatsAppProviderMode =
  | 'MOCK'
  | 'WEBHOOK'
  | 'META_CLOUD'
  | 'DISABLED';

export interface WhatsAppProviderSelectionInput {
  environmentClass:
    WhatsAppEnvironmentClass;

  configuredProvider?:
    string;
}

export interface WhatsAppProviderSelection {
  status: 'READY' | 'BLOCKED';

  scope:
    'PROPERTYOS_WHATSAPP_PROVIDER_SELECTION';

  environmentClass:
    WhatsAppEnvironmentClass;

  mode:
    WhatsAppProviderMode;

  mockAllowed:
    boolean;

  realDeliveryConfigured:
    boolean;

  errors:
    string[];
}

export function resolveWhatsAppProviderSelection(
  input:
    WhatsAppProviderSelectionInput,
): WhatsAppProviderSelection {
  const selection =
    resolveWhatsAppCommunicationProvider({
      environmentClass:
        input.environmentClass,
      configuredProvider:
        input.configuredProvider,
    });

  return {
    status:
      selection.status,

    scope:
      'PROPERTYOS_WHATSAPP_PROVIDER_SELECTION',

    environmentClass:
      input.environmentClass,

    mode:
      selection.provider,

    mockAllowed:
      selection.mockAllowed,

    realDeliveryConfigured:
      selection
        .realDeliveryConfigured,

    errors: [
      ...selection.errors,
    ],
  };
}

export function currentWhatsAppEnvironmentClass(
  nodeEnvironment?: string,
): WhatsAppEnvironmentClass {
  return currentCommunicationEnvironmentClass(
    nodeEnvironment,
  );
}
