import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import {
  Request,
} from 'express';

import {
  AuthTokenPayload,
} from '../../../auth/services/auth.service';
import {
  IdempotentOperationOptions,
} from '../decorators/idempotent-operation.decorator';
import {
  PlatformIdempotencyScope,
} from '../platform-idempotency.types';
import {
  PlatformIdempotencyFingerprintService,
} from '../services/platform-idempotency-fingerprint.service';

const DEFAULT_EXPIRY_SECONDS =
  24 * 60 * 60;

const MINIMUM_EXPIRY_SECONDS =
  60;

const MAXIMUM_EXPIRY_SECONDS =
  7 * 24 * 60 * 60;

export type PlatformAuthenticatedHttpRequest =
  Request & {
    user?:
      AuthTokenPayload;
  };

@Injectable()
export class PlatformIdempotencyContextBuilder {
  constructor(
    private readonly fingerprint:
      PlatformIdempotencyFingerprintService,
  ) {}

  build(
    request:
      PlatformAuthenticatedHttpRequest,

    options:
      IdempotentOperationOptions,

    idempotencyKey: string,
  ): PlatformIdempotencyScope {
    const actorId =
      request.user?.sub?.trim();

    if (!actorId) {
      throw new UnauthorizedException(
        'Authenticated actor is required for idempotent execution',
      );
    }

    const operation =
      options.operation.trim();

    if (!operation) {
      throw new BadRequestException(
        'Idempotent operation name is required',
      );
    }

    const resourceKey =
      options.resource(
        request,
      )?.trim();

    if (!resourceKey) {
      throw new BadRequestException(
        'Idempotent resource key is required',
      );
    }

    const expiresInSeconds =
      options.expiresInSeconds ??
      DEFAULT_EXPIRY_SECONDS;

    if (
      !Number.isInteger(
        expiresInSeconds,
      ) ||
      expiresInSeconds <
        MINIMUM_EXPIRY_SECONDS ||
      expiresInSeconds >
        MAXIMUM_EXPIRY_SECONDS
    ) {
      throw new BadRequestException(
        'Idempotency expiry must be between 60 seconds and 7 days',
      );
    }

    const requestFingerprint =
      this.fingerprint.fingerprint({
        method:
          request.method
            .toUpperCase(),
        operation,
        resourceKey,
        params:
          request.params ?? {},
        query:
          request.query ?? {},
        body:
          request.body ?? null,
      });

    return {
      actorId,
      operation,
      resourceKey,
      idempotencyKey:
        idempotencyKey.trim(),
      requestFingerprint,
      expiresAt:
        new Date(
          Date.now() +
          expiresInSeconds *
            1000,
        ),
    };
  }
}
