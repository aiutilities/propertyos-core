import { PropertySpecialistAgentRouterService } from "../../src/core/ai/router/services/property-specialist-agent-router.service";

describe("PropertySpecialistAgentRouterService", () => {
  it("routes to highest priority capable agent", () => {
    const router = new PropertySpecialistAgentRouterService();

    const decision = router.route(
      {
        objective: "analyse lease",
        requiredCapabilities: ["lease"],
      },
      [
        {
          id: "general",
          domain: "general",
          priority: 10,
          capabilities: ["lease"],
          enabled: true,
        },
        {
          id: "property-specialist",
          domain: "property",
          priority: 100,
          capabilities: ["lease", "payments"],
          enabled: true,
        },
      ],
    );

    expect(decision.selectedAgentId).toBe("property-specialist");
  });
});
