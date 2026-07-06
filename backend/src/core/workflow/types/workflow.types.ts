export type WorkflowStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export interface WorkflowDefinition {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  entityType: string;
  initialState: string;
  isActive: boolean;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowState {
  id: string;
  workflowDefinitionId: string;
  code: string;
  name: string;
  isInitial: boolean;
  isFinal: boolean;
  sortOrder: number;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

export interface WorkflowTransition {
  id: string;
  workflowDefinitionId: string;
  fromState: string;
  toState: string;
  actionCode: string;
  actionName: string;
  requiredPermission?: string | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

export interface WorkflowInstance {
  id: string;
  workflowDefinitionId: string;
  entityType: string;
  entityId: string;
  currentState: string;
  status: WorkflowStatus;
  metadata: Record<string, unknown>;
  createdBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowHistory {
  id: string;
  workflowInstanceId: string;
  fromState?: string | null;
  toState: string;
  actionCode: string;
  actorId?: string | null;
  notes?: string | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

export interface CreateWorkflowDefinitionInput {
  code: string;
  name: string;
  description?: string;
  entityType: string;
  initialState: string;
  states: Array<{
    code: string;
    name: string;
    isInitial?: boolean;
    isFinal?: boolean;
    sortOrder?: number;
    metadata?: Record<string, unknown>;
  }>;
  transitions: Array<{
    fromState: string;
    toState: string;
    actionCode: string;
    actionName: string;
    requiredPermission?: string;
    metadata?: Record<string, unknown>;
  }>;
  metadata?: Record<string, unknown>;
}

export interface StartWorkflowInput {
  workflowDefinitionId: string;
  entityType: string;
  entityId: string;
  createdBy?: string;
  metadata?: Record<string, unknown>;
}

export interface TransitionWorkflowInput {
  workflowInstanceId: string;
  actionCode: string;
  actorId?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
}
