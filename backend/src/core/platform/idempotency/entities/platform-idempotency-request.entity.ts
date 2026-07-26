export type PlatformIdempotencyStatus =
  | 'RUNNING'
  | 'COMPLETE'
  | 'FAILED';

export interface PlatformIdempotencyRequest {
  id: string;
  actorId: string;
  operation: string;
  resourceKey: string;
  idempotencyKey: string;
  requestFingerprint: string;
  status: PlatformIdempotencyStatus;
  responseStatus: number | null;
  responsePayload: unknown;
  errorPayload: unknown;
  attemptNumber: number;
  startedAt: Date;
  heartbeatAt: Date;
  completedAt: Date | null;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
