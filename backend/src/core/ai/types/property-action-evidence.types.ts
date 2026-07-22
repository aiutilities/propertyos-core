export type PropertyActionEvidenceStatus =
  | 'PROPOSED'
  | 'GOVERNANCE_DECIDED'
  | 'EXECUTED'
  | 'PENDING_APPROVAL'
  | 'BLOCKED';


export interface PropertyActionEvidence {

  propertyId:
    string;

  action:
    string;

  status:
    PropertyActionEvidenceStatus;

  message:
    string;

}
