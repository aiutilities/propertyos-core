import { Injectable } from "@nestjs/common";

import {
  AiCapability,
  AiDataClassification,
  AiExecutionMode,
  AiTokenBudget,
} from "../../ai";
import { ConfigurationService } from "../../configuration";

export type HelpdeskAiOperation = "TRIAGE" | "REPLY_DRAFTING";

export interface HelpdeskAiRequestPolicy {
  capability: AiCapability;
  executionMode: AiExecutionMode;
  dataClassification: AiDataClassification;
  temperature: number;
  maxTokens: number;
  tokenBudget: AiTokenBudget;
  providerName?: string;
  fallbackProviderNames: readonly string[];
  advisoryOnly: true;
}

interface HelpdeskAiPolicyDefaults {
  capability: AiCapability;
  temperature: number;
  maxTokens: number;
  temperatureKey: string;
  maxTokensKey: string;
}

const POLICY_DEFAULTS: Readonly<
  Record<HelpdeskAiOperation, Readonly<HelpdeskAiPolicyDefaults>>
> = Object.freeze({
  TRIAGE: Object.freeze({
    capability: "CLASSIFICATION",
    temperature: 0,
    maxTokens: 500,
    temperatureKey: "helpdesk.ai.triage.temperature",
    maxTokensKey: "helpdesk.ai.triage.maxTokens",
  }),
  REPLY_DRAFTING: Object.freeze({
    capability: "TEXT_GENERATION",
    temperature: 0.2,
    maxTokens: 700,
    temperatureKey: "helpdesk.ai.reply.temperature",
    maxTokensKey: "helpdesk.ai.reply.maxTokens",
  }),
});

@Injectable()
export class HelpdeskAiPolicyService {
  constructor(
    private readonly configurationService: ConfigurationService,
  ) {}

  async resolve(
    operation: HelpdeskAiOperation,
  ): Promise<Readonly<HelpdeskAiRequestPolicy>> {
    const defaults = POLICY_DEFAULTS[operation];

    const [temperature, maxTokens] = await Promise.all([
      this.readNumber(
        defaults.temperatureKey,
        defaults.temperature,
        (value) =>
          Number.isFinite(value) &&
          value >= 0 &&
          value <= 2,
      ),
      this.readNumber(
        defaults.maxTokensKey,
        defaults.maxTokens,
        (value) =>
          Number.isInteger(value) &&
          value > 0 &&
          value <= 100_000,
      ),
    ]);

    return this.freeze({
      capability: defaults.capability,
      executionMode: "SIMULATED",
      dataClassification: "INTERNAL",
      temperature,
      maxTokens,
      tokenBudget: {
        maxOutputTokens: maxTokens,
      },
      fallbackProviderNames: [],
      advisoryOnly: true,
    });
  }

  private async readNumber(
    key: string,
    fallback: number,
    isValid: (value: number) => boolean,
  ): Promise<number> {
    try {
      const setting =
        await this.configurationService.getByScopeAndKey(
          "PLATFORM",
          undefined,
          key,
        );

      const value =
        typeof setting.value === "number"
          ? setting.value
          : typeof setting.value === "string" &&
              setting.value.trim() !== ""
            ? Number(setting.value)
            : Number.NaN;

      return isValid(value) ? value : fallback;
    } catch {
      return fallback;
    }
  }

  private freeze(
    policy: HelpdeskAiRequestPolicy,
  ): Readonly<HelpdeskAiRequestPolicy> {
    const tokenBudget = Object.freeze({
      ...policy.tokenBudget,
    });

    const fallbackProviderNames = Object.freeze([
      ...policy.fallbackProviderNames,
    ]);

    return Object.freeze({
      ...policy,
      tokenBudget,
      fallbackProviderNames,
    });
  }
}
