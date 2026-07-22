import {
  AiCapability,
  AiMessage,
} from '../types/ai.types';
import {
  AiCostBudget,
  AiDataClassification,
  AiExecutionMode,
  AiOrchestrationLoopSummary,
  AiTokenBudget,
} from '../types/ai-orchestration.types';

export const PROPERTYOS_AI_SDK_VERSION =
  '1.0.0' as const;

export type PropertyOsAiSdkVersion =
  typeof PROPERTYOS_AI_SDK_VERSION;

export interface PropertyOsAiRequest {
  tenantId: string;
  moduleId: string;
  capability: AiCapability;
  messages: AiMessage[];
  executionMode?: AiExecutionMode;
  dataClassification?: AiDataClassification;
  providerName?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  tokenBudget?: AiTokenBudget;
  costBudget?: AiCostBudget;
  fallbackProviderNames?: string[];
  humanApprovalReference?: string;
  timeoutMs?: number;
  correlationId?: string;
  metadata?: Record<string, unknown>;
}

export interface PropertyOsAiUsage {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
}

export interface PropertyOsAiExecutionAttempt {
  providerName: string;
  attempt: number;
  status: 'SUCCEEDED' | 'FAILED';
  failureCode?: string;
  startedAt: string;
  completedAt: string;
  durationMs: number;
}

export interface PropertyOsAiSuccess {
  ok: true;
  sdkVersion: PropertyOsAiSdkVersion;
  correlationId: string;
  content: string;
  providerName: string;
  model?: string;
  usage?: PropertyOsAiUsage;
  attempts: PropertyOsAiExecutionAttempt[];
  loop?: AiOrchestrationLoopSummary;
  raw?: unknown;
}

export type PropertyOsAiErrorCode =
  | 'INVALID_SDK_REQUEST'
  | 'PROVIDER_NOT_FOUND'
  | 'PROVIDER_TIMEOUT'
  | 'PROVIDER_EXECUTION_FAILED'
  | 'TOKEN_BUDGET_EXCEEDED'
  | 'ALL_PROVIDERS_FAILED'
  | 'AI_SDK_EXECUTION_FAILED';

export interface PropertyOsAiFailure {
  ok: false;
  sdkVersion: PropertyOsAiSdkVersion;
  correlationId: string;
  error: {
    code: PropertyOsAiErrorCode;
    message: string;
    retriable: boolean;
    details?: Record<string, unknown>;
  };
}

export type PropertyOsAiResult =
  | PropertyOsAiSuccess
  | PropertyOsAiFailure;
