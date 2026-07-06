import { Injectable } from '@nestjs/common';
import { IntegrationConnectorPort } from '../contracts/integration-connector.contract';

@Injectable()
export class IntegrationConnectorRegistry {
  private readonly connectors = new Map<string, IntegrationConnectorPort>();

  register(connector: IntegrationConnectorPort): void {
    this.connectors.set(connector.name, connector);
  }

  get(name: string): IntegrationConnectorPort | undefined {
    return this.connectors.get(name);
  }

  list(): IntegrationConnectorPort[] {
    return Array.from(this.connectors.values());
  }

  getDefault(): IntegrationConnectorPort | undefined {
    return this.list()[0];
  }
}
