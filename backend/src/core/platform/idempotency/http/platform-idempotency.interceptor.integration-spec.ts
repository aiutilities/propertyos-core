import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
} from '@nestjs/common';
import {
  Reflector,
} from '@nestjs/core';
import {
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import {
  Request,
  Response,
} from 'express';
import {
  lastValueFrom,
  of,
} from 'rxjs';

import {
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
import {
  PlatformIdempotencyInterceptor,
} from './platform-idempotency.interceptor';

const createContext = (
  handler: Function,
  headers:
    Record<string, unknown> = {
      'idempotency-key':
        'request-key-0001',
    },
) => {
  const request = {
    method:
      'POST',
    params: {
      slug:
        'example',
    },
    query: {},
    body: {
      enabled:
        true,
    },
    headers,
    user: {
      sub:
        'actor-1',
    },
  } as unknown as
    PlatformAuthenticatedHttpRequest;

  const setHeader =
    jest.fn(
      (
        _name: string,
        _value: string,
      ) => undefined,
    );

  const status =
    jest.fn(
      (
        _statusCode: number,
      ) => response,
    );

  const response = {
    statusCode:
      201,
    setHeader,
    status,
  } as unknown as Response;

  const context = {
    getHandler:
      () => handler,
    getClass:
      () => class TestController {},
    switchToHttp:
      () => ({
        getRequest:
          () => request,
        getResponse:
          () => response,
      }),
  } as unknown as
    ExecutionContext;

  return {
    context,
    request,
    response,
    setHeader,
    status,
  };
};

describe(
  'PlatformIdempotencyInterceptor',
  () => {
    const options:
      IdempotentOperationOptions = {
        operation:
          'platform.test.execute',
        required:
          true,
        expiresInSeconds:
          300,
        resource:
          (
            request: Request,
          ) =>
            `resource:${request.params.slug}`,
      };

    const createInterceptor = (
      execute:
        PlatformIdempotencyService['execute'],
    ) => {
      const builder = {
        build:
          jest.fn(
            () => ({
              actorId:
                'actor-1',
              operation:
                'platform.test.execute',
              resourceKey:
                'resource:example',
              idempotencyKey:
                'request-key-0001',
              requestFingerprint:
                'a'.repeat(64),
              expiresAt:
                new Date(
                  Date.now() +
                  60_000,
                ),
            }),
          ),
      };

      const service = {
        execute,
      };

      return {
        interceptor:
          new PlatformIdempotencyInterceptor(
            new Reflector(),
            builder as unknown as
              PlatformIdempotencyContextBuilder,
            service as unknown as
              PlatformIdempotencyService,
          ),
        builder,
      };
    };

    it(
      'passes through handlers without metadata',
      async () => {
        const handler =
          () => true;

        const {
          context,
        } = createContext(
          handler,
        );

        const execute =
          jest.fn();

        const {
          interceptor,
        } = createInterceptor(
          execute as unknown as
            PlatformIdempotencyService['execute'],
        );

        const next: CallHandler = {
          handle:
            () =>
              of({
                success: true,
              }),
        };

        await expect(
          lastValueFrom(
            interceptor.intercept(
              context,
              next,
            ),
          ),
        ).resolves.toEqual({
          success: true,
        });

        expect(
          execute,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'rejects a missing required key',
      async () => {
        const handler =
          () => true;

        Reflect.defineMetadata(
          IDEMPOTENT_OPERATION_METADATA,
          options,
          handler,
        );

        const {
          context,
        } = createContext(
          handler,
          {},
        );

        const {
          interceptor,
        } = createInterceptor(
          jest.fn() as unknown as
            PlatformIdempotencyService['execute'],
        );

        await expect(
          lastValueFrom(
            interceptor.intercept(
              context,
              {
                handle:
                  () => of(true),
              },
            ),
          ),
        ).rejects.toBeInstanceOf(
          BadRequestException,
        );
      },
    );

    it(
      'executes the handler once and marks a fresh response',
      async () => {
        const handler =
          () => true;

        Reflect.defineMetadata(
          IDEMPOTENT_OPERATION_METADATA,
          options,
          handler,
        );

        const {
          context,
          setHeader,
        } = createContext(
          handler,
        );

        const nextHandle =
          jest.fn(
            () =>
              of({
                created: true,
              }),
          );

        const execute =
          jest.fn(
            async (
              input: {
                execute:
                  () => Promise<unknown>;
              },
            ) => ({
              replayed:
                false,
              value:
                await input.execute(),
              record: {
                responseStatus:
                  201,
              },
            }),
          );

        const {
          interceptor,
        } = createInterceptor(
          execute as unknown as
            PlatformIdempotencyService['execute'],
        );

        await expect(
          lastValueFrom(
            interceptor.intercept(
              context,
              {
                handle:
                  nextHandle,
              },
            ),
          ),
        ).resolves.toEqual({
          created: true,
        });

        expect(
          nextHandle,
        ).toHaveBeenCalledTimes(1);

        expect(
          setHeader,
        ).toHaveBeenCalledWith(
          IDEMPOTENCY_REPLAYED_HEADER,
          'false',
        );
      },
    );

    it(
      'persists the final response status after handler execution',
      async () => {
        const handler =
          () => true;

        Reflect.defineMetadata(
          IDEMPOTENT_OPERATION_METADATA,
          options,
          handler,
        );

        const {
          context,
          response,
        } = createContext(
          handler,
        );

        const execute =
          jest.fn(
            async (
              input: {
                execute:
                  () => Promise<{
                    value: unknown;
                    statusCode: number;
                  }>;
                serialize:
                  (
                    execution: {
                      value: unknown;
                    },
                  ) => unknown;
              },
            ) => {
              (
                response as unknown as {
                  statusCode: number;
                }
              ).statusCode = 204;

              const execution =
                await input.execute();

              expect(
                execution.statusCode,
              ).toBe(204);

              expect(
                input.serialize(
                  execution,
                ),
              ).toEqual({
                updated: true,
              });

              return {
                replayed:
                  false,
                value:
                  execution,
                record: {
                  responseStatus:
                    204,
                },
              };
            },
          );

        const {
          interceptor,
        } = createInterceptor(
          execute as unknown as
            PlatformIdempotencyService['execute'],
        );

        await expect(
          lastValueFrom(
            interceptor.intercept(
              context,
              {
                handle:
                  () =>
                    of({
                      updated:
                        true,
                    }),
              },
            ),
          ),
        ).resolves.toEqual({
          updated: true,
        });
      },
    );

    it(
      'replays stored data without executing the handler',
      async () => {
        const handler =
          () => true;

        Reflect.defineMetadata(
          IDEMPOTENT_OPERATION_METADATA,
          options,
          handler,
        );

        const {
          context,
          setHeader,
          status,
        } = createContext(
          handler,
        );

        const nextHandle =
          jest.fn(
            () =>
              of({
                shouldNotRun:
                  true,
              }),
          );

        const execute =
          jest.fn(
            async () => ({
              replayed:
                true,
              value: {
                stored:
                  true,
              },
              record: {
                responseStatus:
                  202,
              },
            }),
          );

        const {
          interceptor,
        } = createInterceptor(
          execute as unknown as
            PlatformIdempotencyService['execute'],
        );

        await expect(
          lastValueFrom(
            interceptor.intercept(
              context,
              {
                handle:
                  nextHandle,
              },
            ),
          ),
        ).resolves.toEqual({
          stored: true,
        });

        expect(
          nextHandle,
        ).not.toHaveBeenCalled();

        expect(
          status,
        ).toHaveBeenCalledWith(
          202,
        );

        expect(
          setHeader,
        ).toHaveBeenCalledWith(
          IDEMPOTENCY_REPLAYED_HEADER,
          'true',
        );
      },
    );

    it(
      'allows a missing optional key to bypass idempotency',
      async () => {
        const handler =
          () => true;

        Reflect.defineMetadata(
          IDEMPOTENT_OPERATION_METADATA,
          {
            ...options,
            required:
              false,
          },
          handler,
        );

        const {
          context,
        } = createContext(
          handler,
          {},
        );

        const execute =
          jest.fn();

        const {
          interceptor,
        } = createInterceptor(
          execute as unknown as
            PlatformIdempotencyService['execute'],
        );

        await expect(
          lastValueFrom(
            interceptor.intercept(
              context,
              {
                handle:
                  () =>
                    of({
                      bypassed:
                        true,
                    }),
              },
            ),
          ),
        ).resolves.toEqual({
          bypassed: true,
        });

        expect(
          execute,
        ).not.toHaveBeenCalled();
      },
    );
  },
);
