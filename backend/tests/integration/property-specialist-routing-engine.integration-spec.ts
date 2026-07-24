import { PropertySpecialistAgentRegistryService } from "../../src/core/ai/router/registry/property-specialist-agent-registry.service";
import { PropertySpecialistRoutingEngineService } from "../../src/core/ai/router/services/property-specialist-routing-engine.service";
import { PropertySpecialistAgentScoringService } from "../../src/core/ai/router/scoring/property-specialist-agent-scoring.service";

describe("PropertySpecialistRoutingEngineService", () => {
  it("returns the best capable agent", () => {
    const registry = new PropertySpecialistAgentRegistryService();
    const scoring = new PropertySpecialistAgentScoringService();

    registry.register({
      id: "general",
      name: "General",
      priority: 1,
      capabilities: ["lease"],
      canHandle: () => true,
      confidence: () => 0.60,
    });

    registry.register({
      id: "property-specialist",
      name: "Property Specialist",
      priority: 5,
      capabilities: ["lease"],
      canHandle: () => true,
      confidence: () => 0.95,
    });

    const engine = new PropertySpecialistRoutingEngineService(
      registry,
      scoring,
    );

    expect(engine.route("lease")?.id).toBe("property-specialist");
  });

  it("returns undefined when nobody can handle the capability", () => {
    const engine = new PropertySpecialistRoutingEngineService(
      new PropertySpecialistAgentRegistryService(),
      new PropertySpecialistAgentScoringService(),
    );

    expect(engine.route("maintenance")).toBeUndefined();
  });
});
