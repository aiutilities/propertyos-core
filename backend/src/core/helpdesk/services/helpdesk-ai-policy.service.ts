import { Injectable } from "@nestjs/common";

import {
  AiCapability,
  AiDataClassification,
  AiExecutionMode,
  AiTokenBudget,
} from "../../ai";

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

@Injectable()
export class HelpdeskAiPolicyService {
  resolve(operation: HelpdeskAiOperation): Readonly<HelpdeskAiRequestPolicy> {
    switch (operation) {
      case "TRIAGE":
        return this.freeze({
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

      case "REPLY_DRAFTING":
        return this.freeze({
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
