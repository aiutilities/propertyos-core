export type PropertyAiAgentConsensusDecision =
  | 'CONSENSUS_REACHED'
  | 'HUMAN_REVIEW_REQUIRED';


export interface PropertyAiAgentConsensusResult {

  propertyId:
    string;

  decision:
    PropertyAiAgentConsensusDecision;

  recommendation:
    string;

  confidence:
    number;

  reason:
    string;

}
