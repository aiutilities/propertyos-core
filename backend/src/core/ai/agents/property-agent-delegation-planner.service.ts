import {
  Injectable,
} from '@nestjs/common';

import {
  PropertySpecialistAgentRegistryService,
} from './property-specialist-agent.registry.service';

import {
  PropertyAgentDelegation,
} from '../types/property-agent-delegation.types';


@Injectable()
export class PropertyAgentDelegationPlannerService {


  constructor(
    private readonly registry:
      PropertySpecialistAgentRegistryService,
  ) {}


  delegate(
    sourceAgentId:
      string,

    capability:
      string,

    reason:
      string,
  ):
    PropertyAgentDelegation {


    const agents =
      this.registry.getByCapability(
        capability,
      );


    if (
      agents.length === 0
    ) {

      throw new Error(
        `No specialist found for capability: ${capability}`,
      );

    }


    return {

      sourceAgentId,

      targetAgentId:
        agents[0].agent.id,

      capability,

      reason,

    };

  }


  delegateMany(
    sourceAgentId:
      string,

    capability:
      string,

    reason:
      string,
  ):
    PropertyAgentDelegation[] {


    const agents =
      this.registry.getByCapability(
        capability,
      );


    if (
      agents.length === 0
    ) {

      throw new Error(
        `No specialist found for capability: ${capability}`,
      );

    }


    return agents.map(
      specialist => ({

        sourceAgentId,

        targetAgentId:
          specialist.agent.id,

        capability,

        reason,

      }),
    );

  }

}
