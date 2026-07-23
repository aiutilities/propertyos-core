import {
  Injectable,
} from '@nestjs/common';

import {
  AiAgentPlannerService,
} from '../ai-agent-planner.service';

import {
  AiAgentExecutionService,
} from '../ai-agent-execution.service';

import {
  AiAgentIdentity,
} from '../../types/ai-agent.types';

import {
  PropertyAiAgentGoal,
} from '../goals/property-ai-agent-goal.types';

import {
  PropertyAiAgentSupervisionResult,
} from './property-ai-agent-supervisor.types';


@Injectable()
export class PropertyAiAgentSupervisorService {


  constructor(
    private readonly planner:
      AiAgentPlannerService,

    private readonly execution:
      AiAgentExecutionService,
  ) {}


  supervise(
    goal:
      PropertyAiAgentGoal,

    agent:
      AiAgentIdentity,

    capabilities:
      string[],
  ):
    PropertyAiAgentSupervisionResult {


    const plan =
      this.planner.ready(

        this.planner.createPlan(

          agent.id,

          goal.goal,

          capabilities,

        ),

      );


    const executions =
      plan.steps.map(
        step =>

          this.execution.execute(

            agent,

            {

              agentId:
                agent.id,

              planId:
                plan.id,

              capabilityId:
                step.capabilityId,

              stepOrder:
                step.order,

              context:
                {
                  goalId:
                    goal.id,
                },

            },

          ),

      );


    return {

      goalId:
        goal.id,

      plan,

      executions,

      completed:
        executions.every(
          item =>
            item.success,
        ),

      generatedAt:
        new Date()
          .toISOString(),

    };

  }


}
