import { Injectable } from "@nestjs/common";
import {
  PropertySpecialistAgentDescriptor,
  PropertySpecialistRouteDecision,
  PropertySpecialistRouteRequest,
} from "../contracts/property-specialist-router.types";

@Injectable()
export class PropertySpecialistAgentRouterService {
  route(
    request: PropertySpecialistRouteRequest,
    agents: readonly PropertySpecialistAgentDescriptor[],
  ): PropertySpecialistRouteDecision {
    const candidates = agents
      .filter((a) => a.enabled)
      .filter((a) =>
        request.requiredCapabilities.every((c) =>
          a.capabilities.includes(c),
        ),
      )
      .sort((a, b) => b.priority - a.priority);

    const selected =
      candidates.find((a) => a.id === request.preferredAgentId) ??
      candidates[0];

    if (!selected) {
      throw new Error("No eligible Property Specialist agent found.");
    }

    return {
      selectedAgentId: selected.id,
      confidence: 1,
      reason: "highest-priority-capability-match",
    };
  }
}
