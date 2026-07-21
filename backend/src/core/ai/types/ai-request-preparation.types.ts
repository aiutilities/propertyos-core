export type AiPreparedMessageRole =
  | 'SYSTEM'
  | 'USER'
  | 'ASSISTANT'
  | 'TOOL';

export interface AiRequestPreparationMessage {
  role: string;
  content: string;
  name?: string;
  metadata?: Readonly<Record<string, unknown>>;
}

export interface AiRequestGenerationOptions {
  temperature?: number;
  topP?: number;
  maxOutputTokens?: number;
  stopSequences?: readonly string[];
}

export interface AiRequestGenerationDefaults {
  temperature?: number;
  topP?: number;
  maxOutputTokens?: number;
}

export interface AiRequestPreparationInput {
  provider: string;
  model: string;
  messages: readonly AiRequestPreparationMessage[];
  systemPrompt?: string;
  generation?: AiRequestGenerationOptions;
  defaults?: AiRequestGenerationDefaults;
  metadata?: Readonly<Record<string, unknown>>;
  requestId?: string;
  preparedAt?: string;
}

export interface AiPreparedMessage {
  readonly role: AiPreparedMessageRole;
  readonly content: string;
  readonly name?: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface AiRequestPreparationEvidence {
  readonly requestId: string;
  readonly provider: string;
  readonly model: string;
  readonly messageCount: number;
  readonly systemPromptPresent: boolean;
  readonly temperature: number;
  readonly topP: number;
  readonly maxOutputTokens: number;
  readonly stopSequenceCount: number;
  readonly preparedAt: string;
  readonly normalizations: readonly string[];
}

export interface AiPreparedProviderRequest {
  readonly requestId: string;
  readonly provider: string;
  readonly model: string;
  readonly messages: readonly AiPreparedMessage[];
  readonly systemPrompt?: string;
  readonly temperature: number;
  readonly topP: number;
  readonly maxOutputTokens: number;
  readonly stopSequences: readonly string[];
  readonly metadata?: Readonly<Record<string, unknown>>;
  readonly evidence: AiRequestPreparationEvidence;
}
