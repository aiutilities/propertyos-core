import { PropertySpecialistAgentRegistryService } from "../../src/core/ai/router/registry/property-specialist-agent-registry.service";

describe("PropertySpecialistAgentRegistryService", () => {
  it("registers and filters capable agents", () => {
    const registry = new PropertySpecialistAgentRegistryService();

    registry.register({
      id: "leasing",
      name: "Leasing",
      priority: 5,
      capabilities: ["lease"],
      canHandle: () => true,
      confidence: () => 0.95
    });

    expect(registry.capable("lease")).toHaveLength(1);
    expect(registry.capable("maintenance")).toHaveLength(0);
  });
});
