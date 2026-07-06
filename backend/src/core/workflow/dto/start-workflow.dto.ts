export class StartWorkflowDto {
  workflowDefinitionId!: string;
  entityType!: string;
  entityId!: string;
  createdBy?: string;
  metadata?: Record<string, unknown>;
}
