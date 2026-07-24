import { PropertySpecialistAgentRegistryService } from "../../src/core/ai/router/registry/property-specialist-agent-registry.service";
import { PropertySpecialistAgentScoringService } from "../../src/core/ai/router/scoring/property-specialist-agent-scoring.service";

describe("Capability Routing", () => {
  it("selects the highest scored capable agent", () => {
    const registry = new PropertySpecialistAgentRegistryService();
    const scoring = new PropertySpecialistAgentScoringService();

    registry.register({
      id: "general",
      name: "General",
      priority: 1,
      capabilities: ["lease"],
      canHandle: () => true,
      confidence: () => 0.70
    });

    registry.register({
      id: "property-specialist",
      name: "Property Specialist",
      priority: 5,
      capabilities: ["lease"],
      canHandle: () => true,
      confidence: () => 0.95
    });

    const selected = registry
      .capable("lease")
      .sort(
        (a, b) =>
          scoring.score(b, "lease") -
          scoring.score(a, "lease")
      )[0];

    expect(selected.id).toBe("property-specialist");
  });
});
