import { AiMessage } from "../../types/ai.types";
import { AiToolCallBatchResult } from "./ai-tool-call-orchestration.types";

export interface AiToolInteractionProjectionInput {
  readonly batchResult: AiToolCallBatchResult;
  readonly includeSkippedCalls?: boolean;
}

export interface AiToolInteractionProjectionEvidence {
  readonly requestedRecordCount: number;
  readonly projectedMessageCount: number;
  readonly omittedSkippedCount: number;
  readonly includeSkippedCalls: boolean;
}

export interface AiToolInteractionProjectionResult {
  readonly messages: readonly AiMessage[];
  readonly evidence: AiToolInteractionProjectionEvidence;
}
