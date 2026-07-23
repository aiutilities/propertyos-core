import {
  Injectable,
} from '@nestjs/common';

import {
  PropertyAiAgentSupervisionResult,
} from './property-ai-agent-supervisor.types';

import {
  PropertyAiAgentReplanningResult,
} from './property-ai-agent-replanning.types';


@Injectable()
export class PropertyAiAgentReplanningService {


  evaluate(
    supervision:
      PropertyAiAgentSupervisionResult,
  ):
    PropertyAiAgentReplanningResult {


    const failedExecutions =
      supervision.executions.filter(
        execution =>
          !execution.success,
      )
      .length;


    if (
      failedExecutions === 0
    ) {

      return {

        goalId:
          supervision.goalId,

        decision:
          'COMPLETE_GOAL',

        reason:
          'All agent executions completed successfully',

        failedExecutions:

          0,

        generatedAt:
          new Date()
            .toISOString(),

      };

    }


    return {

      goalId:
        supervision.goalId,

      decision:
        'REPLAN_REQUIRED',

      reason:
        'One or more agent executions failed',

      failedExecutions,

      generatedAt:
        new Date()
          .toISOString(),

    };

  }


}
