export type AiAgentExecutionStatus =
  | 'EXECUTED'
  | 'BLOCKED'
  | 'FAILED';


export interface AiAgentExecutionRequest {

  agentId: string;

  planId: string;

  capabilityId: string;

  stepOrder: number;

  context?: Record<string, unknown>;
}


export interface AiAgentExecutionResult {

  success: boolean;

  agentId: string;

  capabilityId: string;

  stepOrder: number;

  status: AiAgentExecutionStatus;

  evidenceEvent: string;

  reason: string;
}
