import { describe, expect, it } from "@jest/globals";

import { ConfigurationService } from "../../configuration";
import { HelpdeskAiPolicyService } from "./helpdesk-ai-policy.service";

type StoredValue = string | number | boolean | object | null;

function createService(
  settings: Readonly<Record<string, StoredValue>> = {},
): HelpdeskAiPolicyService {
  const configurationService = {
    async getByScopeAndKey(
      scopeType: string,
      scopeId: string | undefined,
      key: string,
    ) {
      expect(scopeType).toBe("PLATFORM");
      expect(scopeId).toBeUndefined();

      if (!(key in settings)) {
        throw new Error(`Configuration setting not found: ${key}`);
      }

      return {
        id: key,
        scopeType: "PLATFORM",
        scopeId: undefined,
        key,
        value: settings[key],
        valueType: "JSON",
        isSecret: false,
        createdAt: new Date(0),
        updatedAt: new Date(0),
      };
    },
  } as unknown as ConfigurationService;

  return new HelpdeskAiPolicyService(
    configurationService,
  );
}

describe("HelpdeskAiPolicyService", () => {
  it("returns immutable triage defaults", async () => {
    const policy =
      await createService().resolve("TRIAGE");

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
    expect(
      Object.isFrozen(policy.fallbackProviderNames),
    ).toBe(true);
  });

  it("returns immutable reply-drafting defaults", async () => {
    const policy =
      await createService().resolve(
        "REPLY_DRAFTING",
      );

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
    expect(
      Object.isFrozen(policy.fallbackProviderNames),
    ).toBe(true);
  });

  it("applies valid persisted triage overrides", async () => {
    const policy = await createService({
      "helpdesk.ai.triage.temperature": "0.4",
      "helpdesk.ai.triage.maxTokens": 900,
    }).resolve("TRIAGE");

    expect(policy.temperature).toBe(0.4);
    expect(policy.maxTokens).toBe(900);
    expect(policy.tokenBudget).toEqual({
      maxOutputTokens: 900,
    });
  });

  it("applies valid persisted reply overrides", async () => {
    const policy = await createService({
      "helpdesk.ai.reply.temperature": 0.7,
      "helpdesk.ai.reply.maxTokens": "1200",
    }).resolve("REPLY_DRAFTING");

    expect(policy.temperature).toBe(0.7);
    expect(policy.maxTokens).toBe(1200);
    expect(policy.tokenBudget).toEqual({
      maxOutputTokens: 1200,
    });
  });

  it("falls back safely for invalid values", async () => {
    const triage = await createService({
      "helpdesk.ai.triage.temperature": 4,
      "helpdesk.ai.triage.maxTokens": 0,
    }).resolve("TRIAGE");

    const reply = await createService({
      "helpdesk.ai.reply.temperature": "invalid",
      "helpdesk.ai.reply.maxTokens": 100_001,
    }).resolve("REPLY_DRAFTING");

    expect(triage.temperature).toBe(0);
    expect(triage.maxTokens).toBe(500);
    expect(reply.temperature).toBe(0.2);
    expect(reply.maxTokens).toBe(700);
  });

  it("never permits configuration to select execution or providers", async () => {
    const policy = await createService({
      "helpdesk.ai.triage.executionMode": "LIVE",
      "helpdesk.ai.triage.providerName": "openai",
      "helpdesk.ai.triage.fallbackProviderNames": [
        "claude",
      ],
    }).resolve("TRIAGE");

    expect(policy.executionMode).toBe("SIMULATED");
    expect(policy.providerName).toBeUndefined();
    expect(policy.fallbackProviderNames).toEqual([]);
    expect(policy.advisoryOnly).toBe(true);
  });

  it("returns independent immutable policy values", async () => {
    const service = createService();

    const first = await service.resolve("TRIAGE");
    const second = await service.resolve("TRIAGE");

    expect(second).toEqual(first);
    expect(second).not.toBe(first);
    expect(second.tokenBudget).not.toBe(
      first.tokenBudget,
    );
    expect(second.fallbackProviderNames).not.toBe(
      first.fallbackProviderNames,
    );
  });
});
