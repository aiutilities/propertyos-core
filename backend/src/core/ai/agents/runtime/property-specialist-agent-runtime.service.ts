import {
  Injectable,
} from '@nestjs/common';

import {
  PropertyAiAgentProposal,
} from '../../collaboration/property-ai-agent-negotiation.types';

import {
  PropertyExecutableSpecialistAgent,
  PropertySpecialistAgentExecutionContext,
} from './property-specialist-agent-runtime.types';


@Injectable()
export class PropertySpecialistAgentRuntimeService {


  private readonly agents =
    new Map<
      string,
      PropertyExecutableSpecialistAgent
    >();


  register(
    agent:
      PropertyExecutableSpecialistAgent,
  ): void {


    if (
      this.agents.has(
        agent.agentId,
      )
    ) {

      throw new Error(
        `Executable specialist already registered: ${agent.agentId}`,
      );

    }


    this.agents.set(
      agent.agentId,
      agent,
    );

  }


  has(
    agentId:
      string,
  ): boolean {

    return this.agents.has(
      agentId,
    );

  }


  get(
    agentId:
      string,
  ):
    PropertyExecutableSpecialistAgent {


    const agent =
      this.agents.get(
        agentId,
      );


    if (
      !agent
    ) {

      throw new Error(
        `Executable specialist not registered: ${agentId}`,
      );

    }


    return agent;

  }


  async execute(

    agentId:
      string,

    context:
      PropertySpecialistAgentExecutionContext,

  ):
    Promise<PropertyAiAgentProposal> {


    const agent =
      this.get(
        agentId,
      );


    if (
      !agent.capabilities.includes(
        context.capability,
      )
    ) {

      throw new Error(
        `Executable specialist ${agentId} does not support capability: ${context.capability}`,
      );

    }


    const proposal =
      await agent.execute(
        context,
      );


    if (
      proposal.agentId
      !== agentId
    ) {

      throw new Error(
        `Executable specialist returned mismatched agent id: ${proposal.agentId}`,
      );

    }


    return proposal;

  }


  list():
    PropertyExecutableSpecialistAgent[] {

    return Array.from(
      this.agents.values(),
    );

  }

}
