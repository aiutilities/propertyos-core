export type PropertyAiAgentStrategyDecision =
  | 'RETRY'
  | 'CHANGE_STRATEGY'
  | 'ESCALATE';


export interface PropertyAiAgentStrategySelection {

  propertyId:
    string;

  action:
    string;

  decision:
    PropertyAiAgentStrategyDecision;

  confidenceAdjustment:
    number;

  reason:
    string;

  successRate:
    number;

  historicalExecutions:
    number;

}
