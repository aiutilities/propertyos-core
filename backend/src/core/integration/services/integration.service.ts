import { Injectable, OnModuleInit } from '@nestjs/common';
import { EventBusService } from '../../eventbus/services/eventbus.service';
import { MockIntegrationConnector } from '../connectors/mock-integration.connector';
import { ExecuteIntegrationActionDto } from '../dto/execute-integration-action.dto';
import { RegisterIntegrationDto } from '../dto/register-integration.dto';
import { IntegrationConnectorRegistry } from '../registries/integration-connector.registry';
import { IntegrationRepository } from '../repositories/integration.repository';
import {
  Integration,
  IntegrationActionResponse,
  IntegrationConnector,
} from '../types/integration.types';

@Injectable()
export class IntegrationService implements OnModuleInit {
  private readonly eventSource = 'core.integration';

  constructor(
    private readonly repository: IntegrationRepository,
    private readonly connectorRegistry: IntegrationConnectorRegistry,
    private readonly mockConnector: MockIntegrationConnector,
    private readonly eventBus: EventBusService,
  ) {}

  onModuleInit(): void {
    this.connectorRegistry.register(this.mockConnector);
  }

  listConnectors(): IntegrationConnector[] {
    return this.connectorRegistry
      .list()
      .map((connector) => connector.getConnector());
  }

  async register(dto: RegisterIntegrationDto): Promise<Integration> {
    const existing = this.repository.findByName(dto.name);

    if (existing) {
      return existing;
    }

    const integration = this.repository.create({
      name: dto.name,
      displayName: dto.displayName,
      category: dto.category,
      connectorName: dto.connectorName,
      status: 'REGISTERED',
      config: dto.config ?? {},
      metadata: dto.metadata ?? {},
    });

    await this.eventBus.publish('integration.registered', this.eventSource, {
      integrationId: integration.id,
      name: integration.name,
      connectorName: integration.connectorName,
      category: integration.category,
    });

    return integration;
  }

  list(): Integration[] {
    return this.repository.list();
  }

  get(id: string): Integration | undefined {
    return this.repository.findById(id);
  }

  async activate(id: string): Promise<Integration | undefined> {
    const integration = this.repository.updateStatus(id, 'ACTIVE');

    if (integration) {
      await this.eventBus.publish('integration.activated', this.eventSource, {
        integrationId: id,
        name: integration.name,
        connectorName: integration.connectorName,
      });
    }

    return integration;
  }

  async deactivate(id: string): Promise<Integration | undefined> {
    const integration = this.repository.updateStatus(id, 'INACTIVE');

    if (integration) {
      await this.eventBus.publish('integration.deactivated', this.eventSource, {
        integrationId: id,
        name: integration.name,
        connectorName: integration.connectorName,
      });
    }

    return integration;
  }

  async execute(dto: ExecuteIntegrationActionDto): Promise<IntegrationActionResponse> {
    const integration = dto.integrationId
      ? this.repository.findById(dto.integrationId)
      : undefined;

    const connectorName =
      integration?.connectorName ?? dto.connectorName ?? 'mock';

    const connector = this.connectorRegistry.get(connectorName);

    if (!connector) {
      return {
        success: false,
        connectorName,
        action: dto.action,
        error: `Integration connector not found: ${connectorName}`,
      };
    }

    await this.eventBus.publish('integration.action.requested', this.eventSource, {
      integrationId: integration?.id,
      connectorName,
      action: dto.action,
      metadata: dto.metadata ?? {},
    });

    const response = await connector.execute({
      integrationId: integration?.id,
      connectorName,
      action: dto.action,
      payload: dto.payload ?? {},
      metadata: dto.metadata ?? {},
    });

    await this.eventBus.publish('integration.action.completed', this.eventSource, {
      integrationId: integration?.id,
      connectorName,
      action: dto.action,
      success: response.success,
    });

    return response;
  }
}
