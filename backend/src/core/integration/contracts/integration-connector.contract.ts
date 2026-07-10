import {
  IntegrationActionRequest,
  IntegrationActionResponse,
  IntegrationConnector,
  IntegrationCapability,
  IntegrationCategory,
} from '../types/integration.types';

export interface IntegrationConnectorPort {
  readonly name: string;
  readonly displayName: string;
  readonly category: IntegrationCategory;
  readonly capabilities: IntegrationCapability[];

  getConnector(): IntegrationConnector;

  execute(request: IntegrationActionRequest): Promise<IntegrationActionResponse>;
}
