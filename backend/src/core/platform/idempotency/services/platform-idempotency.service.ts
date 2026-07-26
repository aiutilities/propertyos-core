import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';

import {
  PlatformIdempotencyRequest,
} from '../entities/platform-idempotency-request.entity';
import {
  PlatformIdempotencyExecutionOptions,
  PlatformIdempotencyExecutionResult,
  PlatformIdempotencyScope,
} from '../platform-idempotency.types';
import {
  PlatformIdempotencyRepository,
  PlatformIdempotencyTransaction,
} from '../repositories/platform-idempotency.repository';

const IDEMPOTENCY_KEY_PATTERN =
  /^[A-Za-z0-9][A-Za-z0-9._:-]{7,254}$/;

const DEFAULT_RUNNING_STALE_AFTER_MS =
  5 * 60 * 1000;

interface PlatformIdempotencyLockedSuccess<T> {
  succeeded: true;
  result:
    PlatformIdempotencyExecutionResult<T>;
}

interface PlatformIdempotencyLockedFailure {
  succeeded: false;
  error: unknown;
}

type PlatformIdempotencyLockedResult<T> =
  | PlatformIdempotencyLockedSuccess<T>
  | PlatformIdempotencyLockedFailure;

@Injectable()
export class PlatformIdempotencyService {
  constructor(
    private readonly repository:
      PlatformIdempotencyRepository,
  ) {}

  async execute<T>(
    options:
      PlatformIdempotencyExecutionOptions<T>,
  ): Promise<
    PlatformIdempotencyExecutionResult<T>
  > {
    this.validateScope(
      options.scope,
    );

    const locked =
      await this.repository
        .executeWithLock(
          options.scope,
          async (
            transaction,
          ) =>
            this.executeLocked(
              transaction,
              options,
            ),
        );

    if (
      locked.succeeded === false
    ) {
      throw locked.error;
    }

    return locked.result;
  }

  private async executeLocked<T>(
    transaction:
      PlatformIdempotencyTransaction,

    options:
      PlatformIdempotencyExecutionOptions<T>,
  ): Promise<
    PlatformIdempotencyLockedResult<T>
  > {
    const existing =
      transaction.state;

    if (existing) {
      this.assertFingerprint(
        existing,
        options.scope,
      );

      if (
        existing.status ===
          'COMPLETE' &&
        existing.expiresAt.getTime() >
          Date.now()
      ) {
        return {
          succeeded: true,
          result: {
            replayed: true,
            value:
              existing.responsePayload as T,
            record:
              existing,
          },
        };
      }

      if (
        existing.status ===
          'RUNNING' &&
        this.isRunningRequestFresh(
          existing,
        )
      ) {
        throw new ConflictException({
          error:
            'IDEMPOTENCY_REQUEST_IN_PROGRESS',
          message:
            'An identical idempotent operation is already running',
        });
      }
    }

    const started =
      await transaction.start(
        options.scope,
      );

    try {
      const value =
        await options.execute();

      const payload =
        options.serialize
          ? options.serialize(value)
          : value;

      const runtimeStatusCode =
        this.resolveStatusCode(
          value,
          options.statusCode,
        );

      const completed =
        await transaction.complete(
          started.id,
          {
            statusCode:
              runtimeStatusCode,
            payload,
          },
        );

      return {
        succeeded: true,
        result: {
          replayed: false,
          value,
          record:
            completed,
        },
      };
    } catch (error) {
      await transaction.fail(
        started.id,
        this.serializeError(error),
      );

      return {
        succeeded: false,
        error,
      };
    }
  }

  private resolveStatusCode(
    value: unknown,
    configured:
      number | undefined,
  ): number {
    if (
      value !== null &&
      typeof value === 'object' &&
      'statusCode' in value &&
      typeof (
        value as {
          statusCode?: unknown;
        }
      ).statusCode === 'number'
    ) {
      return (
        value as {
          statusCode: number;
        }
      ).statusCode;
    }

    return configured ?? 200;
  }

  private isRunningRequestFresh(
    request:
      PlatformIdempotencyRequest,
  ): boolean {
    return (
      request.heartbeatAt.getTime() +
        DEFAULT_RUNNING_STALE_AFTER_MS >
      Date.now()
    );
  }

  private assertFingerprint(
    existing:
      PlatformIdempotencyRequest,
    scope:
      PlatformIdempotencyScope,
  ): void {
    if (
      existing.requestFingerprint !==
      scope.requestFingerprint
    ) {
      throw new ConflictException({
        error:
          'IDEMPOTENCY_KEY_REUSED',
        message:
          'The idempotency key was already used with different request data',
      });
    }

    if (
      existing.resourceKey !==
      scope.resourceKey
    ) {
      throw new ConflictException({
        error:
          'IDEMPOTENCY_RESOURCE_CONFLICT',
        message:
          'The idempotency key was already used for a different resource',
      });
    }
  }

  private validateScope(
    scope:
      PlatformIdempotencyScope,
  ): void {
    if (
      !scope.actorId.trim() ||
      !scope.operation.trim() ||
      !scope.resourceKey.trim()
    ) {
      throw new BadRequestException(
        'Idempotency actor, operation, and resource are required',
      );
    }

    if (
      !IDEMPOTENCY_KEY_PATTERN.test(
        scope.idempotencyKey,
      )
    ) {
      throw new BadRequestException(
        'Idempotency key must contain 8 to 255 safe characters',
      );
    }

    if (
      !/^[a-f0-9]{64}$/.test(
        scope.requestFingerprint,
      )
    ) {
      throw new BadRequestException(
        'Request fingerprint must be a lowercase SHA-256 digest',
      );
    }

    if (
      scope.expiresAt.getTime() <=
      Date.now()
    ) {
      throw new BadRequestException(
        'Idempotency expiry must be in the future',
      );
    }
  }

  private serializeError(
    error: unknown,
  ): Record<string, unknown> {
    if (error instanceof Error) {
      return {
        name:
          error.name,
        message:
          error.message,
      };
    }

    return {
      name:
        'UnknownError',
      message:
        String(error),
    };
  }
}
