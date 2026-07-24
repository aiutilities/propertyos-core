import { Injectable } from "@nestjs/common";
import { PropertySpecialistAgent } from "../contracts/property-specialist-agent.interface";

@Injectable()
export class PropertySpecialistAgentRegistryService {
  private readonly agents: PropertySpecialistAgent[] = [];

  register(agent: PropertySpecialistAgent): void {
    this.agents.push(agent);
  }

  all(): PropertySpecialistAgent[] {
    return [...this.agents];
  }

  capable(capability: string): PropertySpecialistAgent[] {
    return this.agents.filter(a =>
      a.capabilities.includes(capability)
    );
  }
}
