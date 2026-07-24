import {
  Injectable,
} from '@nestjs/common';

import {
  PropertySpecialistAgent,
} from '../types/property-specialist-agent.types';


@Injectable()
export class PropertySpecialistAgentRegistryService {


  private readonly agents:
    PropertySpecialistAgent[] = [];


  register(
    agent:
      PropertySpecialistAgent,
  ): void {

    const expertiseWeight =
      agent.expertiseWeight
      ?? 1;

    if (
      !Number.isFinite(
        expertiseWeight,
      )
      ||
      expertiseWeight <= 0
    ) {

      throw new Error(
        'Invalid specialist expertise weight',
      );

    }

    this.agents.push({

      ...agent,

      expertiseWeight,

    });

  }


  list():
    PropertySpecialistAgent[] {

    return [
      ...this.agents,
    ];

  }


  getByCapability(
    capability:
      string,
  ):
    PropertySpecialistAgent[] {

    return this.agents.filter(
      item =>
        item.agent.capabilities.includes(
          capability,
        ),
    );

  }


  getByAgentId(
    agentId:
      string,
  ):
    PropertySpecialistAgent
    | undefined {

    return this.agents.find(
      item =>
        item.agent.id
        ===
        agentId,
    );

  }

}
