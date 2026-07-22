import { AiPreparedRequestDispatchEnvelope } from "../../types/ai-prepared-request-dispatch.types";
import { AiToolContinuationBoundaryResult } from "./ai-tool-continuation-boundary.types";

export interface AiToolContinuationDispatchInput {
  readonly parentEnvelope: AiPreparedRequestDispatchEnvelope;
  readonly continuation: AiToolContinuationBoundaryResult;
  readonly dispatchedAt?: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface AiToolContinuationDispatchEvidence {
  readonly requestId: string;
  readonly parentDispatchId: string;
  readonly continuationDispatchId: string;
  readonly provider: string;
  readonly runtimeProvider: string;
  readonly protocol: string;
  readonly model: string;
  readonly originalMessageCount: number;
  readonly continuationMessageCount: number;
  readonly toolCallIds: readonly string[];
}

export interface AiToolContinuationDispatchResult {
  readonly envelope: AiPreparedRequestDispatchEnvelope;
  readonly evidence: AiToolContinuationDispatchEvidence;
}
