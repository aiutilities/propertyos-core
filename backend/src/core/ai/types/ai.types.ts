export type AiProviderStatus = "ACTIVE" | "INACTIVE";

export type AiCapability =
  | "CHAT"
  | "TEXT_GENERATION"
  | "CLASSIFICATION"
  | "SUMMARIZATION"
  | "EXTRACTION"
  | "EMBEDDINGS"
  | "VISION"
  | "TOOL_CALLING";

export interface AiProvider {
  id: string;
  name: string;
  displayName: string;
  status: AiProviderStatus;
  capabilities: AiCapability[];
  defaultModel?: string;
  metadata?: Record<string, unknown>;
}

export interface AiMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  toolCallId?: string;
  toolName?: string;
}

export interface AiRequest {
  providerName?: string;
  model?: string;
  messages: AiMessage[];
  temperature?: number;
  maxTokens?: number;
  metadata?: Record<string, unknown>;
}

export interface AiResponse {
  providerName: string;
  model?: string;
  content: string;
  raw?: unknown;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
  };
}
