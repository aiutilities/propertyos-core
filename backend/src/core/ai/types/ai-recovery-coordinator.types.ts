import {
  AiRecoveryPlan,
} from './ai-recovery.types';

export interface AiRecoveryContext {
  correlationId: string;
  tenantId: string;
  attemptCount: number;
  maxAttempts: number;
}

export interface AiRecoveryCoordinationResult {
  plan: AiRecoveryPlan;
  approved: boolean;
  executable: boolean;
  reason: string;
}
