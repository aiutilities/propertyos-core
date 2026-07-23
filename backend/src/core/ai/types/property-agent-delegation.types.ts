export interface PropertyAgentDelegation {

  sourceAgentId:
    string;

  targetAgentId:
    string;

  capability:
    string;

  reason:
    string;

}


export interface PropertyAgentDelegationPlan {

  sourceAgentId:
    string;

  capability:
    string;

  reason:
    string;

  delegations:
    PropertyAgentDelegation[];

}
