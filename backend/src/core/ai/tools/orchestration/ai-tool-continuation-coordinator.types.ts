import { AiExecutionContext } from "../../types/ai-execution-context.types";
import { AiToolExecutionContext } from "../types/ai-tool.types";
import { AiPreparedRequestDispatchEnvelope } from "../../types/ai-prepared-request-dispatch.types";
import {
  AiToolCall,
  AiToolCallBatchResult,
} from "./ai-tool-call-orchestration.types";
import { AiToolContinuationBoundaryResult } from "./ai-tool-continuation-boundary.types";
import { AiToolContinuationDispatchResult } from "./ai-tool-continuation-dispatch.types";
import { AiToolContinuationExecutionResult } from "./ai-tool-continuation-execution.types";
import { AiToolInteractionProjectionResult } from "./ai-tool-interaction-projection.types";

export interface AiToolContinuationCoordinatorInput {
  readonly calls: readonly AiToolCall[];
  readonly parentEnvelope: AiPreparedRequestDispatchEnvelope;
  readonly parentContext: AiExecutionContext;
  readonly toolContext: AiToolExecutionContext;
  readonly maximumCalls?: number;
  readonly continueOnFailure?: boolean;
  readonly includeSkippedCalls?: boolean;
  readonly dispatchedAt?: string;
  readonly startedAt?: string;
  readonly executionId?: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface AiToolContinuationCoordinatorEvidence {
  readonly requestId: string;
  readonly correlationId: string;
  readonly parentDispatchId: string;
  readonly continuationDispatchId: string;
  readonly parentExecutionId: string;
  readonly continuationExecutionId: string;
  readonly requestedCallCount: number;
  readonly executedCallCount: number;
  readonly succeededCallCount: number;
  readonly failedCallCount: number;
  readonly skippedCallCount: number;
  readonly projectedMessageCount: number;
  readonly originalMessageCount: number;
  readonly continuationMessageCount: number;
  readonly continuationAttempt: number;
  readonly outcome: "SUCCEEDED";
}

export interface AiToolContinuationCoordinatorResult {
  readonly batch: AiToolCallBatchResult;
  readonly projection: AiToolInteractionProjectionResult;
  readonly continuation: AiToolContinuationBoundaryResult;
  readonly continuationDispatch: AiToolContinuationDispatchResult;
  readonly continuationExecution: AiToolContinuationExecutionResult;
  readonly evidence: AiToolContinuationCoordinatorEvidence;
}
