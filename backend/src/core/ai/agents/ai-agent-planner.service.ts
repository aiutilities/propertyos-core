import {
  Injectable,
} from '@nestjs/common';

import {
  AiAgentTaskPlan,
} from '../types/ai-agent-plan.types';


@Injectable()
export class AiAgentPlannerService {


  createPlan(
    agentId: string,

    goal: string,

    capabilities: string[],
  ): AiAgentTaskPlan {


    const steps =
      capabilities.map(
        (
          capabilityId,
          index,
        ) => ({
          order:
            index + 1,

          capabilityId,

          description:
            `Execute capability ${capabilityId} for goal: ${goal}`,

          status:
            'PENDING' as const,
        }),
      );


    return {

      id:
        `plan-${Date.now()}`,

      agentId,

      goal,

      steps,

      status:
        'CREATED',

      createdAt:
        new Date().toISOString(),
    };
  }


  ready(
    plan: AiAgentTaskPlan,
  ): AiAgentTaskPlan {

    return {
      ...plan,

      status:
        'READY',
    };
  }
}
