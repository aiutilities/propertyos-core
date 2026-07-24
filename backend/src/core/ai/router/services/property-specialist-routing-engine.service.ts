import { Injectable } from "@nestjs/common";

import { PropertySpecialistAgent } from "../contracts/property-specialist-agent.interface";
import { PropertySpecialistAgentRegistryService } from "../registry/property-specialist-agent-registry.service";
import { PropertySpecialistAgentScoringService } from "../scoring/property-specialist-agent-scoring.service";

@Injectable()
export class PropertySpecialistRoutingEngineService {
  constructor(
    private readonly registry: PropertySpecialistAgentRegistryService,
    private readonly scoring: PropertySpecialistAgentScoringService,
  ) {}

  route(
    capability: string,
    payload?: unknown,
  ): PropertySpecialistAgent | undefined {
    return this.registry
      .capable(capability)
      .filter((agent) =>
        agent.canHandle({
          capability,
          payload,
        }),
      )
      .sort(
        (left, right) =>
          this.scoring.score(right, capability, payload) -
          this.scoring.score(left, capability, payload),
      )[0];
  }
}
