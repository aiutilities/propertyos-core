import type {
  AiConversationMessageInput,
  AiConversationRole,
} from './ai-conversation-session.types';

export interface AiModelContextProfile {
  provider: string;
  model: string;
  contextWindowTokens: number;
}

export interface AiTokenBudgetRequest {
  modelProfile:
    AiModelContextProfile;
  reservedCompletionTokens: number;
  safetyBufferTokens?: number;
}

export interface AiContextTokenBudget {
  provider: string;
  model: string;
  contextWindowTokens: number;
  reservedCompletionTokens: number;
  safetyBufferTokens: number;
  maximumPromptTokens: number;
}

export interface AiContextAssemblyRequest {
  modelProfile:
    AiModelContextProfile;
  reservedCompletionTokens: number;
  safetyBufferTokens?: number;
  systemPrompt?: string;
  messages:
    readonly AiConversationMessageInput[];
}

export interface AiAssembledContextMessage {
  role: AiConversationRole;
  content: string;
  metadata:
    Readonly<
      Record<string, string>
    >;
  estimatedTokens: number;
  originalIndex:
    number | null;
  preservedReason:
    | 'SYSTEM'
    | 'LATEST'
    | 'BUDGET_FIT';
}

export interface AiContextAssemblyEvidence {
  provider: string;
  model: string;
  contextWindowTokens: number;
  reservedCompletionTokens: number;
  safetyBufferTokens: number;
  maximumPromptTokens: number;
  estimatedPromptTokens: number;
  estimatedRemainingPromptTokens: number;
  suppliedMessageCount: number;
  assembledMessageCount: number;
  retainedMessageCount: number;
  removedMessageCount: number;
  truncationOccurred: boolean;
  systemMessageCount: number;
  latestMessagePreserved: boolean;
}

export interface AiContextAssemblyResult {
  messages:
    readonly AiAssembledContextMessage[];
  evidence:
    AiContextAssemblyEvidence;
}
