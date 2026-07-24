import { PropertySpecialistAgentBootstrapService } from "../../src/core/ai/router/services/property-specialist-agent-bootstrap.service";
import { PropertySpecialistAgentRegistryService } from "../../src/core/ai/router/registry/property-specialist-agent-registry.service";
import { PropertySpecialistRoutingEngineService } from "../../src/core/ai/router/services/property-specialist-routing-engine.service";
import { PropertySpecialistAgentScoringService } from "../../src/core/ai/router/scoring/property-specialist-agent-scoring.service";

describe("Property Orchestrator Routing", () => {
  it("routes lease requests to Lease Specialist", () => {
    const registry = new PropertySpecialistAgentRegistryService();

    new PropertySpecialistAgentBootstrapService(registry).bootstrap([
      {
        id: "lease-specialist",
        name: "Lease Specialist",
        priority: 10,
        capabilities: ["lease"],
        canHandle: () => true,
        confidence: () => 0.98,
      },
      {
        id: "maintenance-specialist",
        name: "Maintenance Specialist",
        priority: 8,
        capabilities: ["maintenance"],
        canHandle: () => true,
        confidence: () => 0.99,
      },
    ]);

    const engine = new PropertySpecialistRoutingEngineService(
      registry,
      new PropertySpecialistAgentScoringService(),
    );

    expect(engine.route("lease")?.id).toBe("lease-specialist");
    expect(engine.route("maintenance")?.id).toBe("maintenance-specialist");
  });

  it("returns undefined for unsupported capability", () => {
    const engine = new PropertySpecialistRoutingEngineService(
      new PropertySpecialistAgentRegistryService(),
      new PropertySpecialistAgentScoringService(),
    );

    expect(engine.route("accounting")).toBeUndefined();
  });
});
