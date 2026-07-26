import {
  SetMetadata,
} from '@nestjs/common';
import {
  Request,
} from 'express';

export const IDEMPOTENT_OPERATION_METADATA =
  'platform:idempotent-operation';

export const IDEMPOTENCY_KEY_HEADER =
  'idempotency-key';

export const IDEMPOTENCY_REPLAYED_HEADER =
  'idempotency-replayed';

export type PlatformIdempotencyResourceResolver =
  (
    request: Request,
  ) => string;

export interface IdempotentOperationOptions {
  operation: string;

  required?: boolean;

  expiresInSeconds?: number;

  resource:
    PlatformIdempotencyResourceResolver;
}

export const IdempotentOperation = (
  options:
    IdempotentOperationOptions,
) =>
  SetMetadata(
    IDEMPOTENT_OPERATION_METADATA,
    options,
  );
