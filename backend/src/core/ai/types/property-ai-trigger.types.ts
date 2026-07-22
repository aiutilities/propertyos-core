export type PropertyAiTriggerCommand =
  | 'ANALYZE_PROPERTY_HEALTH'
  | 'REVIEW_OPERATIONAL_RISK';


export interface PropertyAiTriggerResult {

  eventType:
    string;

  command:
    PropertyAiTriggerCommand;

  executed:
    boolean;

  propertyId:
    string;

}
