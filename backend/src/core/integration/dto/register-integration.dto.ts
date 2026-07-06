import { IntegrationCategory } from '../types/integration.types';

export class RegisterIntegrationDto {
  name!: string;
  displayName!: string;
  category!: IntegrationCategory;
  connectorName!: string;
  config?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}
