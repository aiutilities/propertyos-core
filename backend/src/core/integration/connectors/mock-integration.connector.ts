import { Injectable } from '@nestjs/common';
import { IntegrationConnectorPort } from '../contracts/integration-connector.contract';
import {
  IntegrationActionRequest,
  IntegrationActionResponse,
  IntegrationCapability,
  IntegrationCategory,
  IntegrationConnector,
} from '../types/integration.types';

@Injectable()
export class MockIntegrationConnector implements IntegrationConnectorPort {
  readonly name = 'mock';
  readonly displayName = 'Mock Integration Connector';
  readonly category: IntegrationCategory = 'CUSTOM';
  readonly capabilities: IntegrationCapability[] = [
    'SEND_MESSAGE',
    'SEND_NOTIFICATION',
    'SEND_WEBHOOK',
    'SYNC_DATA',
    'FETCH_DATA',
    'CUSTOM_ACTION',
  ];

  getConnector(): IntegrationConnector {
    return {
      name: this.name,
      displayName: this.displayName,
      category: this.category,
      capabilities: this.capabilities,
      metadata: {
        purpose: 'Local development placeholder connector',
      },
    };
  }

  async execute(
    request: IntegrationActionRequest,
  ): Promise<IntegrationActionResponse> {
    return {
      success: true,
      connectorName: this.name,
      action: request.action,
      result: {
        message: 'Mock integration action executed',
        payload: request.payload,
        metadata: request.metadata ?? {},
      },
    };
  }
}
