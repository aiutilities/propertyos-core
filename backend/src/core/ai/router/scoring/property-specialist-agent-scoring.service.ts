import { Injectable } from "@nestjs/common";
import { PropertySpecialistAgent } from "../contracts/property-specialist-agent.interface";

@Injectable()
export class PropertySpecialistAgentScoringService {
  score(
    agent: PropertySpecialistAgent,
    capability: string,
    payload?: unknown
  ): number {
    return (
      agent.priority * 100 +
      Math.round(
        agent.confidence({
          capability,
          payload
        }) * 100
      )
    );
  }
}
