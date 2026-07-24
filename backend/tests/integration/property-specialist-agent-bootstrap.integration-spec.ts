import { PropertySpecialistAgentBootstrapService } from "../../src/core/ai/router/services/property-specialist-agent-bootstrap.service";
import { PropertySpecialistAgentRegistryService } from "../../src/core/ai/router/registry/property-specialist-agent-registry.service";

describe("PropertySpecialistAgentBootstrapService", () => {
  it("registers all supplied agents", () => {
    const registry = new PropertySpecialistAgentRegistryService();

    const bootstrap = new PropertySpecialistAgentBootstrapService(
      registry,
    );

    bootstrap.bootstrap([
      {
        id: "leasing",
        name: "Leasing",
        priority: 5,
        capabilities: ["lease"],
        canHandle: () => true,
        confidence: () => 0.95,
      },
      {
        id: "maintenance",
        name: "Maintenance",
        priority: 4,
        capabilities: ["maintenance"],
        canHandle: () => true,
        confidence: () => 0.90,
      },
    ]);

    expect(registry.all()).toHaveLength(2);
    expect(registry.capable("lease")).toHaveLength(1);
    expect(registry.capable("maintenance")).toHaveLength(1);
  });
});
