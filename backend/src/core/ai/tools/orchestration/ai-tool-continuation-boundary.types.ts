import { AiPreparedProviderRequest } from "../../types/ai-request-preparation.types";
import { AiToolInteractionProjectionResult } from "./ai-tool-interaction-projection.types";

export interface AiToolContinuationBoundaryInput {
  readonly request: AiPreparedProviderRequest;
  readonly projection: AiToolInteractionProjectionResult;
}

export interface AiToolContinuationBoundaryEvidence {
  readonly requestId: string;
  readonly originalMessageCount: number;
  readonly projectedMessageCount: number;
  readonly continuationMessageCount: number;
  readonly toolCallIds: readonly string[];
}

export interface AiToolContinuationBoundaryResult {
  readonly request: AiPreparedProviderRequest;
  readonly evidence: AiToolContinuationBoundaryEvidence;
}
