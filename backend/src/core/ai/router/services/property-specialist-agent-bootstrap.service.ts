import { Injectable } from "@nestjs/common";

import { PropertySpecialistAgent } from "../contracts/property-specialist-agent.interface";
import { PropertySpecialistAgentRegistryService } from "../registry/property-specialist-agent-registry.service";

@Injectable()
export class PropertySpecialistAgentBootstrapService {
  constructor(
    private readonly registry: PropertySpecialistAgentRegistryService,
  ) {}

  bootstrap(agents: PropertySpecialistAgent[]): void {
    for (const agent of agents) {
      this.registry.register(agent);
    }
  }
}
