import { Injectable } from "@nestjs/common";

import {
  AiToolOrchestrationDecisionEvidence,
  AiToolOrchestrationDecisionInput,
  AiToolOrchestrationDecisionOutcome,
  AiToolOrchestrationDecisionResult,
} from "./ai-tool-orchestration-decision.types";

@Injectable()
export class AiToolOrchestrationDecisionService {
  decide(
    input: AiToolOrchestrationDecisionInput,
  ): AiToolOrchestrationDecisionResult {
    this.assertInput(input);

    const requestedCallCount = input.calls.length;
    const remainingRounds = Math.max(
      input.maximumRounds - input.currentRound,
      0,
    );

    const outcome = this.resolveOutcome(
      requestedCallCount,
      input.currentRound,
      input.maximumRounds,
    );

    const evidence: AiToolOrchestrationDecisionEvidence = Object.freeze({
      currentRound: input.currentRound,
      maximumRounds: input.maximumRounds,
      requestedCallCount,
      remainingRounds,
      outcome,
    });

    return Object.freeze({
      outcome,
      shouldContinue: outcome === "CONTINUE",
      terminal: outcome === "TERMINAL",
      exhausted: outcome === "EXHAUSTED",
      evidence,
    });
  }

  private resolveOutcome(
    requestedCallCount: number,
    currentRound: number,
    maximumRounds: number,
  ): AiToolOrchestrationDecisionOutcome {
    if (requestedCallCount === 0) {
      return "TERMINAL";
    }

    if (currentRound >= maximumRounds) {
      return "EXHAUSTED";
    }

    return "CONTINUE";
  }

  private assertInput(input: AiToolOrchestrationDecisionInput): void {
    if (!input || typeof input !== "object") {
      throw new Error("AI tool orchestration decision input is required");
    }

    if (!Number.isInteger(input.currentRound) || input.currentRound < 0) {
      throw new Error(
        "AI tool orchestration currentRound must be a non-negative integer",
      );
    }

    if (!Number.isInteger(input.maximumRounds) || input.maximumRounds < 1) {
      throw new Error(
        "AI tool orchestration maximumRounds must be a positive integer",
      );
    }

    if (input.currentRound > input.maximumRounds) {
      throw new Error(
        "AI tool orchestration currentRound cannot exceed maximumRounds",
      );
    }

    if (!Array.isArray(input.calls)) {
      throw new Error(
        "AI tool orchestration decision requires a tool-call collection",
      );
    }

    input.calls.forEach((call, index) => {
      if (!call || typeof call !== "object") {
        throw new Error(`AI tool orchestration call ${index} is invalid`);
      }

      if (typeof call.callId !== "string" || !call.callId.trim()) {
        throw new Error(
          `AI tool orchestration call ${index} requires a callId`,
        );
      }

      if (typeof call.toolId !== "string" || !call.toolId.trim()) {
        throw new Error(
          `AI tool orchestration call ${index} requires a toolId`,
        );
      }
    });
  }
}
