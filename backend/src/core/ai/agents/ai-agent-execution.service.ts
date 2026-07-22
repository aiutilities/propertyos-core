import {
  Injectable,
} from '@nestjs/common';

import {
  AiAgentIdentityService,
} from './ai-agent-identity.service';

import {
  AiAgentCapabilityRegistryService,
} from './ai-agent-capability-registry.service';

import {
  AiAgentExecutionRequest,
  AiAgentExecutionResult,
} from '../types/ai-agent-execution.types';

import {
  AiAgentIdentity,
} from '../types/ai-agent.types';


@Injectable()
export class AiAgentExecutionService {


  constructor(
    private readonly identityService:
      AiAgentIdentityService,

    private readonly capabilityRegistry:
      AiAgentCapabilityRegistryService,
  ) {}


  execute(
    agent: AiAgentIdentity,

    request: AiAgentExecutionRequest,
  ): AiAgentExecutionResult {


    if (
      !this.identityService.canExecute(
        agent,
        request.capabilityId,
      )
    ) {

      return {
        success:
          false,

        agentId:
          request.agentId,

        capabilityId:
          request.capabilityId,

        stepOrder:
          request.stepOrder,

        status:
          'BLOCKED',

        evidenceEvent:
          'ai.agent.execution.blocked',

        reason:
          'Agent capability unavailable',
      };
    }


    if (
      !this.capabilityRegistry.isAllowed(
        request.capabilityId,
      )
    ) {

      return {
        success:
          false,

        agentId:
          request.agentId,

        capabilityId:
          request.capabilityId,

        stepOrder:
          request.stepOrder,

        status:
          'BLOCKED',

        evidenceEvent:
          'ai.agent.execution.blocked',

        reason:
          'Capability disabled',
      };
    }


    return {

      success:
        true,

      agentId:
        request.agentId,

      capabilityId:
        request.capabilityId,

      stepOrder:
        request.stepOrder,

      status:
        'EXECUTED',

      evidenceEvent:
        'ai.agent.execution.completed',

      reason:
        'Agent capability executed',
    };
  }
}
