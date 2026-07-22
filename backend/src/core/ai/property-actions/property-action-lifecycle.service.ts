import {
  Injectable,
} from '@nestjs/common';

import {
  PropertyActionProposal,
} from '../types/property-action-proposal.types';

import {
  PropertyActionGovernanceService,
} from './property-action-governance.service';

import {
  PropertyActionExecutionService,
} from './property-action-execution.service';

import {
  PropertyActionLifecycleResult,
} from '../types/property-action-lifecycle.types';


@Injectable()
export class PropertyActionLifecycleService {


  constructor(

    private readonly governance:
      PropertyActionGovernanceService,

    private readonly execution:
      PropertyActionExecutionService,

  ) {}


  execute(
    proposal:
      PropertyActionProposal,
  ):
    PropertyActionLifecycleResult {


    const governanceResult =
      this.governance.evaluate(
        proposal,
      );


    const executionResult =
      this.execution.execute(
        governanceResult,
      );


    return {

      propertyId:
        proposal.propertyId,

      action:
        proposal.action,

      execution:
        executionResult,

    };

  }

}
