export interface WebhookCommunicationProviderConfiguration {
  providerName: string;
  channel:
    | 'WHATSAPP'
    | 'EMAIL'
    | 'SMS'
    | 'PUSH'
    | 'IN_APP';

  endpoint: string;
  bearerToken?: string;
  timeoutMilliseconds?: number;

  eventName: string;
  payloadVersion?: string;

  minimumTokenLength?: number;
  requireHttps?: boolean;
}

export interface WebhookProviderConfigurationResult {
  status: 'READY' | 'BLOCKED';
  endpoint?: string;
  bearerToken?: string;
  timeoutMilliseconds: number;
  errors: readonly string[];
}

export interface WebhookAcknowledgement {
  success: true;
  messageId: string;
}
