import {
  PropertyActionProposal,
} from './property-action-proposal.types';


export interface PropertyOperationsAiRequest {

  propertyId:
    string;

  capability:
    string;

  reason:
    string;

}


export interface PropertySpecialistExecutionFailure {

  agentId:
    string;

  message:
    string;

}


export interface PropertyOperationsAiResult {

  propertyId:
    string;

  decision:
    string;

  confidence:
    number;

  participatingAgents:
    string[];

  specialistFailures:
    PropertySpecialistExecutionFailure[];

  proposals:
    PropertyActionProposal[];

}
