import {
  AiJsonValue,
  AiToolExecutionContext,
  AiToolExecutionResult,
} from "../types/ai-tool.types";

export interface AiToolCall {
  readonly callId: string;
  readonly toolId: string;
  readonly input: AiJsonValue;
}

export interface AiToolCallBatchInput {
  readonly calls: readonly AiToolCall[];
  readonly context: AiToolExecutionContext;
  readonly maximumCalls?: number;
  readonly continueOnFailure?: boolean;
}

export type AiToolCallOutcome = "SUCCEEDED" | "FAILED" | "SKIPPED";

export interface AiToolCallExecutionRecord {
  readonly callId: string;
  readonly toolId: string;
  readonly sequence: number;
  readonly outcome: AiToolCallOutcome;
  readonly result?: AiToolExecutionResult;
  readonly skipReason?: string;
}

export interface AiToolCallBatchEvidence {
  readonly requestedCallCount: number;
  readonly executedCallCount: number;
  readonly succeededCallCount: number;
  readonly failedCallCount: number;
  readonly skippedCallCount: number;
  readonly maximumCalls: number;
  readonly continueOnFailure: boolean;
  readonly stoppedEarly: boolean;
  readonly durationMs: number;
}

export interface AiToolCallBatchResult {
  readonly records: readonly AiToolCallExecutionRecord[];
  readonly evidence: AiToolCallBatchEvidence;
}
