import {
  Injectable,
} from '@nestjs/common';

import {
  PropertyActionGovernanceResult,
} from '../types/property-action-governance.types';

import {
  PropertyActionExecutionResult,
} from '../types/property-action-execution.types';


@Injectable()
export class PropertyActionExecutionService {


  execute(
    governance:
      PropertyActionGovernanceResult,
  ): PropertyActionExecutionResult {


    const decision =
      governance.decision;


    if (
      decision.mode === 'EXECUTE'
    ) {

      return {

        propertyId:
          governance.propertyId,

        action:
          governance.action,

        status:
          'EXECUTED',

        message:
          'Property action executed successfully',

      };

    }


    if (
      decision.mode === 'REQUEST_APPROVAL'
    ) {

      return {

        propertyId:
          governance.propertyId,

        action:
          governance.action,

        status:
          'PENDING_APPROVAL',

        message:
          'Property action requires human approval',

      };

    }


    return {

      propertyId:
        governance.propertyId,

      action:
        governance.action,

      status:
        'BLOCKED',

      message:
        'Property action blocked by governance',

    };

  }

}
