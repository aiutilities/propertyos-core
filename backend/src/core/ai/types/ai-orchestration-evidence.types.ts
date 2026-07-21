import {
  AiDataClassification,
  AiExecutionMode,
  AiOrchestrationAttempt,
} from './ai-orchestration.types';
import { AiCapability } from './ai.types';

export type AiOrchestrationEvidenceStatus =
  | 'REQUESTED'
  | 'SUCCEEDED'
  | 'FAILED';

export interface AiOrchestrationEvidence {
  correlationId: string;
  tenantId: string;
  capability: AiCapability;
  executionMode: AiExecutionMode;
  dataClassification: AiDataClassification;
  status: AiOrchestrationEvidenceStatus;
  selectedProviderName?: string;
  selectedModel?: string;
  fallbackProviderNames: string[];
  attempts: AiOrchestrationAttempt[];
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
  };
  failure?: {
    code: string;
    retriable: boolean;
  };
  metadata: Record<string, unknown>;
  recordedAt: string;
}
