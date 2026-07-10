export type IntegrationStatus =
  | 'REGISTERED'
  | 'ACTIVE'
  | 'INACTIVE'
  | 'FAILED'
  | 'ARCHIVED';

export type IntegrationCategory =
  | 'WHATSAPP'
  | 'EMAIL'
  | 'SMS'
  | 'PAYMENT'
  | 'WEBHOOK'
  | 'ERP'
  | 'CRM'
  | 'IOT'
  | 'AI'
  | 'CUSTOM';

export type IntegrationCapability =
  | 'SEND_MESSAGE'
  | 'RECEIVE_MESSAGE'
  | 'SEND_NOTIFICATION'
  | 'CREATE_PAYMENT_LINK'
  | 'VERIFY_PAYMENT'
  | 'SEND_WEBHOOK'
  | 'RECEIVE_WEBHOOK'
  | 'SYNC_DATA'
  | 'FETCH_DATA'
  | 'CUSTOM_ACTION';

export interface IntegrationConnector {
  name: string;
  displayName: string;
  category: IntegrationCategory;
  capabilities: IntegrationCapability[];
  metadata?: Record<string, unknown>;
}

export interface Integration {
  id: string;
  name: string;
  displayName: string;
  category: IntegrationCategory;
  connectorName: string;
  status: IntegrationStatus;
  config: Record<string, unknown>;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface IntegrationActionRequest {
  integrationId?: string;
  connectorName?: string;
  action: IntegrationCapability | string;
  payload: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface IntegrationActionResponse {
  success: boolean;
  connectorName: string;
  action: string;
  result?: unknown;
  error?: string;
}
