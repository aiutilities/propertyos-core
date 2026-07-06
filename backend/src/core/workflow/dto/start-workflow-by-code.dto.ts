export class StartWorkflowByCodeDto {
  workflowCode!: string;
  entityType!: string;
  entityId!: string;
  createdBy?: string;
  metadata?: Record<string, unknown>;
}
