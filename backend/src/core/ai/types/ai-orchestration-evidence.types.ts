import {
  AiDataClassification,
  AiExecutionMode,
  AiOrchestrationAttempt,
  AiOrchestrationLoopSummary,
} from './ai-orchestration.types';
import { AiRecoveryPlan } from './ai-recovery.types';
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
  loop?: AiOrchestrationLoopSummary;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
  };
  failure?: {
    code: string;
    retriable: boolean;
    classification?: {
      category: string;
      severity: string;
      recoveryAction: string;
    };
    recovery?: AiRecoveryPlan;
  };
  recoveryExecution?: {
    status:
      | 'REQUESTED'
      | 'STARTED'
      | 'SUCCEEDED'
      | 'FAILED'
      | 'STOPPED';
    action:
      | 'RETRY'
      | 'FALLBACK_PROVIDER'
      | 'REDUCE_CONTEXT'
      | 'REQUEST_PERMISSION'
      | 'STOP';
    attemptNumber: number;
    message: string;
  };

  metadata: Record<string, unknown>;
  recordedAt: string;
}
