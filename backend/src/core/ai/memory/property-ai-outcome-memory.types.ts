export type PropertyAiOutcomeStatus =
  | 'SUCCESS'
  | 'FAILED'
  | 'REJECTED'
  | 'PENDING';


export interface PropertyAiOutcomeMemory {

  id:
    string;


  propertyId:
    string;


  action:
    string;


  recommendationConfidence:
    number;


  executionStatus:
    PropertyAiOutcomeStatus;


  impactScore:
    number;


  notes:
    string;


  createdAt:
    string;

}
