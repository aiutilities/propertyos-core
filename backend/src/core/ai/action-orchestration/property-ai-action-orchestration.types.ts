export type PropertyAiActionStatus =
  | 'EXECUTED'
  | 'PENDING_APPROVAL'
  | 'BLOCKED';


export interface PropertyAiActionExecution {

  propertyId:
    string;


  action:
    string;


  status:
    PropertyAiActionStatus;


  confidence:
    number;


  governanceMode:
    string;


  message:
    string;

}


export interface PropertyAiActionOrchestrationResult {

  propertyId:
    string;


  executions:
    PropertyAiActionExecution[];


  generatedAt:
    string;

}
