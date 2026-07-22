import { AiCapability, AiRequest, AiResponse } from './ai.types';
import { AiToolExecutionContext } from '../tools/types/ai-tool.types';

export type AiExecutionMode = 'SIMULATED' | 'ISOLATED' | 'LIVE';

export type AiDataClassification =
  | 'PUBLIC'
  | 'INTERNAL'
  | 'CONFIDENTIAL'
  | 'RESTRICTED';

export interface AiTokenBudget {
  maxInputTokens?: number;
  maxOutputTokens?: number;
  maxTotalTokens?: number;
}

export interface AiCostBudget {
  maxEstimatedCostMinor?: number;
  currency?: string;
}

export interface AiOrchestrationRequest extends AiRequest {
  tenantId: string;
  capability: AiCapability;
  executionMode: AiExecutionMode;
  dataClassification: AiDataClassification;
  tokenBudget?: AiTokenBudget;
  costBudget?: AiCostBudget;
  fallbackProviderNames?: string[];
  humanApprovalReference?: string;
  timeoutMs?: number;
  correlationId?: string;
  toolContext?: AiToolExecutionContext;
}

export interface AiOrchestrationAttempt {
  providerName: string;
  attempt: number;
  status: 'SUCCEEDED' | 'FAILED';
  failureCode?: string;
  startedAt: string;
  completedAt: string;
  durationMs: number;
}

export interface AiOrchestrationResult {
  correlationId: string;
  response: AiResponse;
  decision: AiRoutingDecision;
  attempts: AiOrchestrationAttempt[];
}

export interface AiRoutingDecision {
  providerName: string;
  model?: string;
  capability: AiCapability;
  executionMode: AiExecutionMode;
  tenantId: string;
  fallbackProviderNames: string[];
  liveExecutionAuthorized: boolean;
}
