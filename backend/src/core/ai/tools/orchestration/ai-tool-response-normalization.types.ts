import { AiResponse } from "../../types/ai.types";
import { AiToolCall } from "./ai-tool-call-orchestration.types";

export type AiToolResponseProtocol =
  "OPENAI_COMPATIBLE" | "ANTHROPIC_MESSAGES" | "NONE";

export interface AiToolResponseNormalizationInput {
  readonly response: AiResponse;
}

export interface AiToolResponseNormalizationEvidence {
  readonly providerName: string;
  readonly protocol: AiToolResponseProtocol;
  readonly rawResponsePresent: boolean;
  readonly requestedCallCount: number;
  readonly normalizedCallCount: number;
  readonly terminal: boolean;
}

export interface AiToolResponseNormalizationResult {
  readonly calls: readonly AiToolCall[];
  readonly evidence: AiToolResponseNormalizationEvidence;
}
