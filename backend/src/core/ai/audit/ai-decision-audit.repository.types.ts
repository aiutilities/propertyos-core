export interface AiDecisionAuditRecord {

  id:
    string;

  propertyId:
    string;

  command:
    string;

  provider?:
    string;

  model?:
    string;

  confidence:
    number;

  decision:
    string;

  governanceResult?:
    string;

  action?:
    string;

  executionStatus?:
    string;

  createdAt:
    Date;

}
