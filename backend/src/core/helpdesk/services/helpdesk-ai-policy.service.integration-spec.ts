import { describe, expect, it } from "@jest/globals";

import { HelpdeskAiPolicyService } from "./helpdesk-ai-policy.service";

describe("HelpdeskAiPolicyService", () => {
  const service = new HelpdeskAiPolicyService();

  it("returns an immutable triage policy", () => {
    const policy = service.resolve("TRIAGE");

    expect(policy).toEqual({
      capability: "CLASSIFICATION",
      executionMode: "SIMULATED",
      dataClassification: "INTERNAL",
      temperature: 0,
      maxTokens: 500,
      tokenBudget: {
        maxOutputTokens: 500,
      },
      fallbackProviderNames: [],
      advisoryOnly: true,
    });

    expect(Object.isFrozen(policy)).toBe(true);

    expect(Object.isFrozen(policy.tokenBudget)).toBe(true);

    expect(Object.isFrozen(policy.fallbackProviderNames)).toBe(true);
  });

  it("returns an immutable reply-drafting policy", () => {
    const policy = service.resolve("REPLY_DRAFTING");

    expect(policy).toEqual({
      capability: "TEXT_GENERATION",
      executionMode: "SIMULATED",
      dataClassification: "INTERNAL",
      temperature: 0.2,
      maxTokens: 700,
      tokenBudget: {
        maxOutputTokens: 700,
      },
      fallbackProviderNames: [],
      advisoryOnly: true,
    });

    expect(Object.isFrozen(policy)).toBe(true);

    expect(Object.isFrozen(policy.tokenBudget)).toBe(true);

    expect(Object.isFrozen(policy.fallbackProviderNames)).toBe(true);
  });

  it("returns independent policy values", () => {
    const first = service.resolve("TRIAGE");

    const second = service.resolve("TRIAGE");

    expect(second).toEqual(first);
    expect(second).not.toBe(first);
    expect(second.tokenBudget).not.toBe(first.tokenBudget);
    expect(second.fallbackProviderNames).not.toBe(first.fallbackProviderNames);
  });
});
