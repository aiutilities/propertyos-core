import {
  AiControlledAutonomyResult,
} from './ai-controlled-autonomy.types';


export interface PropertyActionGovernanceResult {

  propertyId:
    string;

  action:
    string;

  decision:
    AiControlledAutonomyResult;

}
