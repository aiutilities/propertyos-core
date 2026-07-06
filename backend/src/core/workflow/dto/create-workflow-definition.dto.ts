export class CreateWorkflowDefinitionDto {
  code!: string;
  name!: string;
  description?: string;
  entityType!: string;
  initialState!: string;
  states!: Array<{
    code: string;
    name: string;
    isInitial?: boolean;
    isFinal?: boolean;
    sortOrder?: number;
    metadata?: Record<string, unknown>;
  }>;
  transitions!: Array<{
    fromState: string;
    toState: string;
    actionCode: string;
    actionName: string;
    requiredPermission?: string;
    metadata?: Record<string, unknown>;
  }>;
  metadata?: Record<string, unknown>;
}
