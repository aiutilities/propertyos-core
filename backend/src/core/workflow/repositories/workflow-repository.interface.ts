import {
  CreateWorkflowDefinitionInput,
  StartWorkflowInput,
  TransitionWorkflowInput,
  WorkflowDefinition,
  WorkflowHistory,
  WorkflowInstance,
  WorkflowMetrics,
  WorkflowState,
  WorkflowTransition,
} from '../types/workflow.types';

export const WORKFLOW_REPOSITORY = Symbol('WORKFLOW_REPOSITORY');

export interface WorkflowRepository {
  createDefinition(input: CreateWorkflowDefinitionInput): Promise<WorkflowDefinition>;

  findDefinitionById(id: string): Promise<WorkflowDefinition | null>;

  findDefinitionByCode(code: string): Promise<WorkflowDefinition | null>;

  listDefinitions(): Promise<WorkflowDefinition[]>;

  listStates(workflowDefinitionId: string): Promise<WorkflowState[]>;

  listTransitions(workflowDefinitionId: string): Promise<WorkflowTransition[]>;

  findTransition(
    workflowDefinitionId: string,
    fromState: string,
    actionCode: string,
  ): Promise<WorkflowTransition | null>;

  startInstance(input: StartWorkflowInput): Promise<WorkflowInstance>;

  findInstanceById(id: string): Promise<WorkflowInstance | null>;

  findInstanceByEntity(entityType: string, entityId: string): Promise<WorkflowInstance | null>;

  transitionInstance(
    input: TransitionWorkflowInput,
    toState: string,
    status?: 'ACTIVE' | 'COMPLETED' | 'CANCELLED',
  ): Promise<WorkflowInstance>;

  addHistory(input: {
    workflowInstanceId: string;
    fromState?: string | null;
    toState: string;
    actionCode: string;
    actorId?: string | null;
    notes?: string | null;
    metadata?: Record<string, unknown>;
  }): Promise<WorkflowHistory>;

  listHistory(workflowInstanceId: string): Promise<WorkflowHistory[]>;

  getMetrics(): Promise<WorkflowMetrics>;
}
