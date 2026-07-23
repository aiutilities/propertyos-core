import {
  AiAgentTaskPlan,
} from '../../types/ai-agent-plan.types';

import {
  AiAgentExecutionResult,
} from '../../types/ai-agent-execution.types';


export interface PropertyAiAgentSupervisionResult {

  goalId:
    string;

  plan:
    AiAgentTaskPlan;

  executions:
    AiAgentExecutionResult[];

  completed:
    boolean;

  generatedAt:
    string;

}
