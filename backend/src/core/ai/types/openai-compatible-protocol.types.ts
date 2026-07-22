import {
  AiMessage,
  AiRequest,
  AiResponse,
} from './ai.types';
import {
  AiProviderRuntimeConfiguration,
} from './ai-provider-runtime-configuration.types';

export type OpenAiCompatibleRole =
  AiMessage['role'];

export interface OpenAiCompatibleMessage {
  role: OpenAiCompatibleRole;
  content: string;
}

export interface OpenAiCompatibleChatCompletionRequest {
  model: string;
  messages: OpenAiCompatibleMessage[];
  temperature?: number;
  max_tokens?: number;
  stream: false;
}

export interface OpenAiCompatibleChatCompletionChoice {
  index?: number;
  message?: {
    role?: string;
    content?: unknown;
    tool_calls?: unknown;
  };
  finish_reason?: string | null;
}

export interface OpenAiCompatibleTokenUsage {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
}

export interface OpenAiCompatibleChatCompletionResponse {
  id?: string;
  object?: string;
  created?: number;
  model?: string;
  choices?: OpenAiCompatibleChatCompletionChoice[];
  usage?: OpenAiCompatibleTokenUsage;
}

export interface OpenAiCompatibleExecutionOptions {
  configuration:
    AiProviderRuntimeConfiguration;
  request: AiRequest;
  path?: string;
  headers?: Record<string, string>;
}

export interface OpenAiCompatibleProtocolResult {
  request:
    OpenAiCompatibleChatCompletionRequest;
  response:
    AiResponse;
  raw:
    OpenAiCompatibleChatCompletionResponse;
}
