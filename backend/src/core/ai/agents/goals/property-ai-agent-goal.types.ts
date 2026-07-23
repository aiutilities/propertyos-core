export type PropertyAiAgentGoalStatus =
  | 'CREATED'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'FAILED';


export type PropertyAiAgentGoalPriority =
  | 'LOW'
  | 'MEDIUM'
  | 'HIGH';


export interface PropertyAiAgentGoal {

  id:
    string;

  agentId:
    string;

  propertyId:
    string;

  goal:
    string;

  priority:
    PropertyAiAgentGoalPriority;

  status:
    PropertyAiAgentGoalStatus;

  createdAt:
    string;

  completedAt?:
    string;

}
