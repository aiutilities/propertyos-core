import {
  PropertyAiAgentProposal,
} from '../../collaboration/property-ai-agent-negotiation.types';


export interface PropertySpecialistAgentExecutionContext {

  propertyId:
    string;

  capability:
    string;

  objective:
    string;

}


export interface PropertyExecutableSpecialistAgent {

  agentId:
    string;

  capabilities:
    string[];

  execute(
    context:
      PropertySpecialistAgentExecutionContext,
  ):
    Promise<PropertyAiAgentProposal>;

}
