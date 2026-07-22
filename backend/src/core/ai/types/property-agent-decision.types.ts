export interface PropertyAgentDecision {

  propertyId:
    string;

  decision:
    string;

  confidence:
    number;

  contributingAgents:
    string[];

  rationale:
    string;

}
