export type PropertyAiAgentReplanningDecision =
  | 'COMPLETE_GOAL'
  | 'REPLAN_REQUIRED';


export interface PropertyAiAgentReplanningResult {

  goalId:
    string;

  decision:
    PropertyAiAgentReplanningDecision;

  reason:
    string;

  failedExecutions:
    number;

  generatedAt:
    string;

}
