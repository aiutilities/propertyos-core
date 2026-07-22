import { AiDispatchExecutionResult } from "../../types/ai-dispatch-execution.types";
import { AiExecutionContext } from "../../types/ai-execution-context.types";
import { AiToolContinuationDispatchResult } from "./ai-tool-continuation-dispatch.types";

export interface AiToolContinuationExecutionInput {
  readonly parentContext: AiExecutionContext;
  readonly continuationDispatch: AiToolContinuationDispatchResult;
  readonly executionId?: string;
  readonly startedAt?: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface AiToolContinuationExecutionEvidence {
  readonly requestId: string;
  readonly correlationId: string;
  readonly parentExecutionId: string;
  readonly continuationExecutionId: string;
  readonly parentDispatchId: string;
  readonly continuationDispatchId: string;
  readonly parentAttempt: number;
  readonly continuationAttempt: number;
  readonly provider: string;
  readonly model: string;
  readonly messageCount: number;
  readonly outcome: "SUCCEEDED";
}

export interface AiToolContinuationExecutionResult {
  readonly context: AiExecutionContext;
  readonly execution: AiDispatchExecutionResult;
  readonly evidence: AiToolContinuationExecutionEvidence;
}
