export type PropertyActionType =
  | 'REVIEW_MAINTENANCE'
  | 'ASSIGN_OPERATIONAL_OWNER'
  | 'REVIEW_HELPDESK_ESCALATION';


export interface PropertyActionProposal {

  propertyId:
    string;

  action:
    PropertyActionType;

  reason:
    string;

  confidence:
    number;

  requiresApproval:
    boolean;

}
