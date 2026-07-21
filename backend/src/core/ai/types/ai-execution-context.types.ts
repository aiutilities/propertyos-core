import {
  AiCapability,
} from './ai.types';

import {
  AiDataClassification,
  AiExecutionMode,
} from './ai-orchestration.types';

export interface AiExecutionContextTimestamps {
  readonly createdAt: string;
  readonly startedAt: string;
}

export interface AiExecutionContext {
  readonly tenantId: string;
  readonly requestId: string;
  readonly correlationId: string;
  readonly executionId: string;
  readonly attempt: number;
  readonly capability: AiCapability;
  readonly classification:
    AiDataClassification;
  readonly executionMode:
    AiExecutionMode;
  readonly timeoutMs: number;
  readonly metadata:
    Readonly<Record<string, unknown>>;
  readonly timestamps:
    AiExecutionContextTimestamps;
}

export interface AiExecutionContextInput {
  tenantId: string;
  requestId?: string;
  correlationId?: string;
  executionId?: string;
  attempt: number;
  capability: AiCapability;
  classification:
    AiDataClassification;
  executionMode:
    AiExecutionMode;
  timeoutMs: number;
  metadata?:
    Readonly<Record<string, unknown>>;
  timestamps?: {
    createdAt?: string;
    startedAt?: string;
  };
}
