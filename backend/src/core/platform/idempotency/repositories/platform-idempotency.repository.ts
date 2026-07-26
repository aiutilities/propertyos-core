import {
  PlatformIdempotencyRequest,
} from '../entities/platform-idempotency-request.entity';
import {
  PlatformIdempotencyScope,
  PlatformIdempotencyStoredResponse,
} from '../platform-idempotency.types';

export interface PlatformIdempotencyTransaction {
  state:
    PlatformIdempotencyRequest | null;

  start(
    scope:
      PlatformIdempotencyScope,
  ): Promise<
    PlatformIdempotencyRequest
  >;

  complete(
    id: string,
    response:
      PlatformIdempotencyStoredResponse,
  ): Promise<
    PlatformIdempotencyRequest
  >;

  fail(
    id: string,
    errorPayload: unknown,
  ): Promise<
    PlatformIdempotencyRequest
  >;
}

export abstract class PlatformIdempotencyRepository {
  abstract executeWithLock<T>(
    scope:
      PlatformIdempotencyScope,

    work: (
      transaction:
        PlatformIdempotencyTransaction,
    ) => Promise<T>,
  ): Promise<T>;

  abstract start(
    scope:
      PlatformIdempotencyScope,
  ): Promise<
    PlatformIdempotencyRequest
  >;

  abstract complete(
    id: string,
    response:
      PlatformIdempotencyStoredResponse,
  ): Promise<
    PlatformIdempotencyRequest
  >;

  abstract fail(
    id: string,
    errorPayload: unknown,
  ): Promise<
    PlatformIdempotencyRequest
  >;

  abstract find(
    actorId: string,
    operation: string,
    idempotencyKey: string,
  ): Promise<
    PlatformIdempotencyRequest | null
  >;

  abstract cleanupExpired(
    asOf: Date,
  ): Promise<number>;
}
