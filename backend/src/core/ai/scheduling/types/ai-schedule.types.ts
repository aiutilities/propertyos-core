export type AiScheduleType = "once" | "interval";

export type AiScheduleStatus =
  | "active"
  | "paused"
  | "cancelled"
  | "completed";

export type AiScheduleOccurrenceStatus =
  | "pending"
  | "claimed"
  | "running"
  | "succeeded"
  | "failed"
  | "retry_scheduled"
  | "skipped"
  | "cancelled"
  | "approval_required";

export type AiScheduleBackoffStrategy = "fixed" | "exponential";

export interface AiScheduleRetryPolicy {
  maximumAttempts: number;
  initialDelaySeconds: number;
  maximumDelaySeconds: number;
  backoffStrategy: AiScheduleBackoffStrategy;
}

export interface AiScheduleGovernanceContext {
  propertyId?: string;
  organizationId?: string;
  agentId?: string;
  requiresHumanApproval?: boolean;
  approvalReference?: string;
}

export interface AiScheduleManifest {
  id: string;
  name: string;
  description?: string;
  commandName: string;
  commandPayload: Record<string, unknown>;
  scheduleType: AiScheduleType;
  runAt?: string;
  intervalSeconds?: number;
  timezone: string;
  status: AiScheduleStatus;
  retryPolicy: AiScheduleRetryPolicy;
  governanceContext: AiScheduleGovernanceContext;
  createdBy: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface AiScheduledOccurrence {
  id: string;
  scheduleId: string;
  sequence: number;
  scheduledFor: string;
  status: AiScheduleOccurrenceStatus;
  attemptCount: number;
  nextAttemptAt?: string;
  workerId?: string;
  claimedAt?: string;
  claimExpiresAt?: string;
  startedAt?: string;
  completedAt?: string;
  outcome?: Record<string, unknown>;
  errorCode?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AiScheduleAttempt {
  id: string;
  occurrenceId: string;
  attemptNumber: number;
  workerId: string;
  startedAt: string;
  completedAt?: string;
  status: "running" | "succeeded" | "failed";
  retryable?: boolean;
  errorCode?: string;
  errorMessage?: string;
  outcome?: Record<string, unknown>;
}

export interface AiOccurrenceClaim {
  occurrenceId: string;
  workerId: string;
  claimedAt: string;
  claimExpiresAt: string;
}
