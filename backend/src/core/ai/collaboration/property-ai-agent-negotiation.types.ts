export interface PropertyAiAgentProposal {

  agentId:
    string;

  recommendation:
    string;

  confidence:
    number;

  reasoning:
    string;

  expertiseWeight?:
    number;

}


export interface PropertyAiAgentNegotiationResult {

  propertyId:
    string;

  proposals:
    PropertyAiAgentProposal[];

  selectedProposal:
    PropertyAiAgentProposal;

  agreementScore:
    number;

  supportingAgentIds:
    string[];

  conflictingAgentIds:
    string[];

}
