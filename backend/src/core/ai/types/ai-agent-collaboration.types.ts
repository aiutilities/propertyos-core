export type AiAgentCollaborationStatus =
  | 'CREATED'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'FAILED';


export interface AiAgentCollaborationRequest {

  collaborationId: string;

  objective: string;

  coordinatorAgentId: string;

  participatingAgents: string[];

  status: AiAgentCollaborationStatus;

  createdAt: string;
}


export interface AiAgentCollaborationResult {

  collaborationId: string;

  successful: boolean;

  participatingAgents: string[];

  status: AiAgentCollaborationStatus;

  summary: string;
}
