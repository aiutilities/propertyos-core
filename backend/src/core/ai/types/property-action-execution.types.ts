export type PropertyActionExecutionStatus =
  | 'EXECUTED'
  | 'PENDING_APPROVAL'
  | 'BLOCKED';


export interface PropertyActionExecutionResult {

  propertyId:
    string;

  action:
    string;

  status:
    PropertyActionExecutionStatus;

  message:
    string;

}
