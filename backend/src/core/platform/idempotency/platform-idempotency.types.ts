import {
  PlatformIdempotencyRequest,
} from './entities/platform-idempotency-request.entity';

export interface PlatformIdempotencyScope {
  actorId: string;
  operation: string;
  resourceKey: string;
  idempotencyKey: string;
  requestFingerprint: string;
  expiresAt: Date;
}

export interface PlatformIdempotencyExecutionResult<T> {
  replayed: boolean;
  value: T;
  record: PlatformIdempotencyRequest;
}

export interface PlatformIdempotencyStoredResponse {
  statusCode: number;
  payload: unknown;
}

export interface PlatformIdempotencyExecutionOptions<T> {
  scope: PlatformIdempotencyScope;
  execute: () => Promise<T>;
  statusCode?: number;
  serialize?: (
    value: T,
  ) => unknown;
}
