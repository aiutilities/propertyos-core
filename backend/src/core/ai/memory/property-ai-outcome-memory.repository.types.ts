export interface PropertyAiOutcomeMemoryRecord {

  id:
    string;

  propertyId:
    string;

  command:
    string;

  decision:
    string;

  action?:
    string;

  confidence?:
    number;

  executionStatus:
    string;

  outcomeSummary?:
    string;

  createdAt:
    Date;

}
