import {
  AiRequest,
  AiResponse,
} from './ai.types';
import {
  AiProviderRuntimeConfiguration,
} from './ai-provider-runtime-configuration.types';

export type AnthropicMessagesRole =
  | 'user'
  | 'assistant';

export interface AnthropicMessagesTextBlock {
  type: 'text';
  text: string;
}

export interface AnthropicMessagesInputMessage {
  role: AnthropicMessagesRole;
  content: string;
}

export interface AnthropicMessagesRequest {
  model: string;
  messages: AnthropicMessagesInputMessage[];
  system?: string;
  max_tokens: number;
  temperature?: number;
  stream: false;
}

export interface AnthropicMessagesResponseContentBlock {
  type?: string;
  text?: unknown;
  id?: unknown;
  name?: unknown;
  input?: unknown;
  [key: string]: unknown;
}

export interface AnthropicMessagesTokenUsage {
  input_tokens?: unknown;
  output_tokens?: unknown;
}

export interface AnthropicMessagesResponse {
  id?: string;
  type?: string;
  role?: string;
  model?: string;
  content?: AnthropicMessagesResponseContentBlock[];
  stop_reason?: string | null;
  stop_sequence?: string | null;
  usage?: AnthropicMessagesTokenUsage;
}

export interface AnthropicMessagesExecutionOptions {
  configuration:
    AiProviderRuntimeConfiguration;
  request: AiRequest;
  path?: string;
  headers?: Record<string, string>;
  anthropicVersion?: string;
  defaultMaxTokens?: number;
}

export interface AnthropicMessagesProtocolResult {
  request: AnthropicMessagesRequest;
  response: AiResponse;
  raw: AnthropicMessagesResponse;
}
