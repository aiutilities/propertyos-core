export type PropertyAiCommandType =
  | 'ANALYZE_PROPERTY_HEALTH'
  | 'REVIEW_OPERATIONAL_RISK';


export interface PropertyAiCommandRequest {

  propertyId:
    string;

  command:
    PropertyAiCommandType;

  reason:
    string;

}


export interface PropertyAiCommandResult {

  propertyId:
    string;

  command:
    PropertyAiCommandType;

  decision:
    string;

  confidence:
    number;

  proposals:
    unknown[];

}
