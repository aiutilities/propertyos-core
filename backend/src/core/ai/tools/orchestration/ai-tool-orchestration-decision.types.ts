import { AiToolCall } from "./ai-tool-call-orchestration.types";

export type AiToolOrchestrationDecisionOutcome =
  "TERMINAL" | "CONTINUE" | "EXHAUSTED";

export interface AiToolOrchestrationDecisionInput {
  readonly currentRound: number;
  readonly maximumRounds: number;
  readonly calls: readonly AiToolCall[];
}

export interface AiToolOrchestrationDecisionEvidence {
  readonly currentRound: number;
  readonly maximumRounds: number;
  readonly requestedCallCount: number;
  readonly remainingRounds: number;
  readonly outcome: AiToolOrchestrationDecisionOutcome;
}

export interface AiToolOrchestrationDecisionResult {
  readonly outcome: AiToolOrchestrationDecisionOutcome;
  readonly shouldContinue: boolean;
  readonly terminal: boolean;
  readonly exhausted: boolean;
  readonly evidence: AiToolOrchestrationDecisionEvidence;
}
