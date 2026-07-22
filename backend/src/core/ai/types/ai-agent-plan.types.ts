export type AiAgentPlanStatus =
  | 'CREATED'
  | 'READY'
  | 'COMPLETED'
  | 'FAILED';


export type AiAgentTaskStepStatus =
  | 'PENDING'
  | 'RUNNING'
  | 'COMPLETED'
  | 'FAILED';


export interface AiAgentTaskStep {

  order: number;

  capabilityId: string;

  description: string;

  status: AiAgentTaskStepStatus;
}


export interface AiAgentTaskPlan {

  id: string;

  agentId: string;

  goal: string;

  steps: AiAgentTaskStep[];

  status: AiAgentPlanStatus;

  createdAt: string;
}
