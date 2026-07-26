import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import {
  Reflector,
} from '@nestjs/core';
import {
  Response,
} from 'express';
import {
  Observable,
  from,
  lastValueFrom,
} from 'rxjs';

import {
  IDEMPOTENCY_KEY_HEADER,
  IDEMPOTENCY_REPLAYED_HEADER,
  IDEMPOTENT_OPERATION_METADATA,
  IdempotentOperationOptions,
} from '../decorators/idempotent-operation.decorator';
import {
  PlatformIdempotencyService,
} from '../services/platform-idempotency.service';
import {
  PlatformAuthenticatedHttpRequest,
  PlatformIdempotencyContextBuilder,
} from './platform-idempotency-context-builder.service';

@Injectable()
export class PlatformIdempotencyInterceptor
  implements NestInterceptor {
  constructor(
    private readonly reflector:
      Reflector,

    private readonly contextBuilder:
      PlatformIdempotencyContextBuilder,

    private readonly idempotency:
      PlatformIdempotencyService,
  ) {}

  intercept(
    context:
      ExecutionContext,

    next:
      CallHandler,
  ): Observable<unknown> {
    const options =
      this.reflector
        .getAllAndOverride<
          IdempotentOperationOptions
        >(
          IDEMPOTENT_OPERATION_METADATA,
          [
            context.getHandler(),
            context.getClass(),
          ],
        );

    if (!options) {
      return next.handle();
    }

    return from(
      this.execute(
        context,
        next,
        options,
      ),
    );
  }

  private async execute(
    context:
      ExecutionContext,

    next:
      CallHandler,

    options:
      IdempotentOperationOptions,
  ): Promise<unknown> {
    const http =
      context.switchToHttp();

    const request =
      http.getRequest<
        PlatformAuthenticatedHttpRequest
      >();

    const response =
      http.getResponse<Response>();

    const rawHeader =
      request.headers[
        IDEMPOTENCY_KEY_HEADER
      ];

    const idempotencyKey =
      this.readHeader(
        rawHeader,
      );

    if (!idempotencyKey) {
      if (
        options.required ??
        true
      ) {
        throw new BadRequestException({
          error:
            'IDEMPOTENCY_KEY_REQUIRED',
          message:
            'Idempotency-Key header is required',
        });
      }

      return lastValueFrom(
        next.handle(),
      );
    }

    const scope =
      this.contextBuilder.build(
        request,
        options,
        idempotencyKey,
      );

    const result =
      await this.idempotency.execute({
        scope,
        execute:
          async () => {
            const value =
              await lastValueFrom(
                next.handle(),
              );

            return {
              value,
              statusCode:
                response.statusCode,
            };
          },
        serialize:
          (execution) =>
            execution.value,
      });

    if (
      result.replayed &&
      result.record
        .responseStatus !== null
    ) {
      response.status(
        result.record
          .responseStatus,
      );
    }

    response.setHeader(
      IDEMPOTENCY_REPLAYED_HEADER,
      result.replayed
        ? 'true'
        : 'false',
    );

    if (result.replayed) {
      return result.value;
    }

    const execution =
      result.value as {
        value: unknown;
        statusCode: number;
      };

    return execution.value;
  }

  private readHeader(
    value:
      string |
      string[] |
      undefined,
  ): string | null {
    if (Array.isArray(value)) {
      throw new BadRequestException({
        error:
          'IDEMPOTENCY_KEY_INVALID',
        message:
          'Idempotency-Key header must contain one value',
      });
    }

    const normalized =
      value?.trim();

    return normalized ||
      null;
  }
}
