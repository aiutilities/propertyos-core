import { AiDispatchExecutionResult } from "../../types/ai-dispatch-execution.types";
import { AiExecutionContext } from "../../types/ai-execution-context.types";
import { AiPreparedRequestDispatchEnvelope } from "../../types/ai-prepared-request-dispatch.types";
import { AiResponse } from "../../types/ai.types";
import { AiToolExecutionContext } from "../types/ai-tool.types";
import { AiToolContinuationCoordinatorResult } from "./ai-tool-continuation-coordinator.types";
import {
  AiToolOrchestrationDecisionOutcome,
  AiToolOrchestrationDecisionResult,
} from "./ai-tool-orchestration-decision.types";
import { AiToolResponseNormalizationResult } from "./ai-tool-response-normalization.types";

export interface AiToolOrchestrationLoopInput {
  readonly initialEnvelope: AiPreparedRequestDispatchEnvelope;
  readonly initialContext: AiExecutionContext;
  readonly initialExecution: AiDispatchExecutionResult;
  readonly toolContext: AiToolExecutionContext;
  readonly maximumRounds: number;
  readonly maximumCallsPerRound?: number;
  readonly continueOnFailure?: boolean;
  readonly includeSkippedCalls?: boolean;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface AiToolOrchestrationLoopRound {
  readonly round: number;
  readonly envelope: AiPreparedRequestDispatchEnvelope;
  readonly context: AiExecutionContext;
  readonly execution: AiDispatchExecutionResult;
  readonly normalization: AiToolResponseNormalizationResult;
  readonly decision: AiToolOrchestrationDecisionResult;
  readonly continuation?: AiToolContinuationCoordinatorResult;
}

export interface AiToolOrchestrationLoopEvidence {
  readonly requestId: string;
  readonly correlationId: string;
  readonly initialDispatchId: string;
  readonly initialExecutionId: string;
  readonly finalDispatchId: string;
  readonly finalExecutionId: string;
  readonly maximumRounds: number;
  readonly completedContinuationRounds: number;
  readonly observedResponseCount: number;
  readonly normalizedToolCallCount: number;
  readonly executedToolCallCount: number;
  readonly succeededToolCallCount: number;
  readonly failedToolCallCount: number;
  readonly skippedToolCallCount: number;
  readonly outcome: AiToolOrchestrationDecisionOutcome;
}

export interface AiToolOrchestrationLoopResult {
  readonly outcome: AiToolOrchestrationDecisionOutcome;
  readonly terminal: boolean;
  readonly exhausted: boolean;
  readonly response: AiResponse;
  readonly envelope: AiPreparedRequestDispatchEnvelope;
  readonly context: AiExecutionContext;
  readonly execution: AiDispatchExecutionResult;
  readonly rounds: readonly AiToolOrchestrationLoopRound[];
  readonly evidence: AiToolOrchestrationLoopEvidence;
}
