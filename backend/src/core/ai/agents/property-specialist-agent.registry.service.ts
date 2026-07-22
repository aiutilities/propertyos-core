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

    this.agents.push(
      agent,
    );

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

}
