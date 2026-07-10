export class ExecuteIntegrationActionDto {
  integrationId?: string;
  connectorName?: string;
  action!: string;
  payload?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}
