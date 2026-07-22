import {
  PropertyActionExecutionResult,
} from './property-action-execution.types';


export interface PropertyActionLifecycleResult {

  propertyId:
    string;

  action:
    string;

  execution:
    PropertyActionExecutionResult;

}
