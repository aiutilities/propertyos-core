import {
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import {
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

import {
  PlatformIdempotencyRequest,
} from '../entities/platform-idempotency-request.entity';
import {
  PlatformIdempotencyScope,
  PlatformIdempotencyStoredResponse,
} from '../platform-idempotency.types';
import {
  PlatformIdempotencyRepository,
  PlatformIdempotencyTransaction,
} from '../repositories/platform-idempotency.repository';
import {
  PlatformIdempotencyService,
} from './platform-idempotency.service';

const scope:
  PlatformIdempotencyScope = {
    actorId:
      'actor-1',
    operation:
      'platform.test.operation',
    resourceKey:
      'resource:test:1',
    idempotencyKey:
      'request-key-0001',
    requestFingerprint:
      'a'.repeat(64),
    expiresAt:
      new Date(
        Date.now() +
        60_000,
      ),
  };

const record = (
  overrides:
    Partial<
      PlatformIdempotencyRequest
    > = {},
): PlatformIdempotencyRequest => ({
  id:
    '11111111-1111-4111-8111-111111111111',
  actorId:
    scope.actorId,
  operation:
    scope.operation,
  resourceKey:
    scope.resourceKey,
  idempotencyKey:
    scope.idempotencyKey,
  requestFingerprint:
    scope.requestFingerprint,
  status:
    'RUNNING',
  responseStatus:
    null,
  responsePayload:
    null,
  errorPayload:
    null,
  attemptNumber:
    1,
  startedAt:
    new Date(),
  heartbeatAt:
    new Date(),
  completedAt:
    null,
  expiresAt:
    scope.expiresAt,
  createdAt:
    new Date(),
  updatedAt:
    new Date(),
  ...overrides,
});

type LockedWork =
  (
    transaction:
      PlatformIdempotencyTransaction,
  ) => Promise<unknown>;

const createService = (
  existing:
    PlatformIdempotencyRequest | null,
) => {
  const started =
    record();

  const completed =
    record({
      status:
        'COMPLETE',
      responseStatus:
        200,
      responsePayload: {
        success: true,
      },
      completedAt:
        new Date(),
    });

  const failed =
    record({
      status:
        'FAILED',
      errorPayload: {
        message:
          'failed',
      },
      completedAt:
        new Date(),
    });


  const start =
    jest.fn(
      async (
        _scope:
          PlatformIdempotencyScope,
      ): Promise<
        PlatformIdempotencyRequest
      > =>
        started,
    );

  const complete =
    jest.fn(
      async (
        _id: string,
        _response:
          PlatformIdempotencyStoredResponse,
      ): Promise<
        PlatformIdempotencyRequest
      > =>
        completed,
    );

  const fail =
    jest.fn(
      async (
        _id: string,
        _errorPayload:
          unknown,
      ): Promise<
        PlatformIdempotencyRequest
      > =>
        failed,
    );

  const executeWithLock =
    jest.fn(
      async (
        _scope:
          PlatformIdempotencyScope,
        work:
          LockedWork,
      ): Promise<unknown> =>
        work({
          state:
            existing,
          start,
          complete,
          fail,
        }),
    );

  const find =
    jest.fn(
      async (
        _actorId: string,
        _operation: string,
        _idempotencyKey:
          string,
      ): Promise<
        PlatformIdempotencyRequest | null
      > =>
        null,
    );

  const cleanupExpired =
    jest.fn(
      async (
        _asOf: Date,
      ): Promise<number> =>
        0,
    );

  const repository = {
    executeWithLock,
    start,
    complete,
    fail,
    find,
    cleanupExpired,
  };

  return {
    service:
      new PlatformIdempotencyService(
        repository as unknown as
          PlatformIdempotencyRepository,
      ),
    repository,
  };
};

describe(
  'PlatformIdempotencyService',
  () => {
    it(
      'executes and persists the first request',
      async () => {
        const {
          service,
          repository,
        } = createService(null);

        const operation =
          jest.fn(
            async () => ({
              success: true,
            }),
          );

        const result =
          await service.execute({
            scope,
            execute:
              operation,
          });

        expect(
          result.replayed,
        ).toBe(false);

        expect(
          operation,
        ).toHaveBeenCalledTimes(1);

        expect(
          repository.start,
        ).toHaveBeenCalledWith(
          scope,
        );

        expect(
          repository.complete,
        ).toHaveBeenCalledWith(
          expect.any(String),
          {
            statusCode:
              200,
            payload: {
              success: true,
            },
          },
        );
      },
    );

    it(
      'replays a completed matching request',
      async () => {
        const completed =
          record({
            status:
              'COMPLETE',
            responseStatus:
              200,
            responsePayload: {
              installed: true,
            },
            completedAt:
              new Date(),
          });

        const {
          service,
          repository,
        } = createService(
          completed,
        );

        const operation =
          jest.fn(
            async () => ({
              shouldNotRun:
                true,
            }),
          );

        const result =
          await service.execute({
            scope,
            execute:
              operation,
          });

        expect(
          result,
        ).toMatchObject({
          replayed:
            true,
          value: {
            installed:
              true,
          },
        });

        expect(
          operation,
        ).not.toHaveBeenCalled();

        expect(
          repository.start,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'rejects key reuse with a different fingerprint',
      async () => {
        const {
          service,
        } = createService(
          record({
            requestFingerprint:
              'b'.repeat(64),
          }),
        );

        await expect(
          service.execute({
            scope,
            execute:
              async () => true,
          }),
        ).rejects.toBeInstanceOf(
          ConflictException,
        );
      },
    );

    it(
      'rejects a simultaneous running request',
      async () => {
        const {
          service,
        } = createService(
          record({
            status:
              'RUNNING',
          }),
        );

        await expect(
          service.execute({
            scope,
            execute:
              async () => true,
          }),
        ).rejects.toBeInstanceOf(
          ConflictException,
        );
      },
    );

    it(
      'recovers a stale running request',
      async () => {
        const {
          service,
          repository,
        } = createService(
          record({
            status:
              'RUNNING',
            heartbeatAt:
              new Date(
                Date.now() -
                10 * 60 * 1000,
              ),
          }),
        );

        const operation =
          jest.fn(
            async () => ({
              recovered:
                true,
            }),
          );

        const result =
          await service.execute({
            scope,
            execute:
              operation,
          });

        expect(
          result.replayed,
        ).toBe(false);

        expect(
          operation,
        ).toHaveBeenCalledTimes(1);

        expect(
          repository.start,
        ).toHaveBeenCalledTimes(1);
      },
    );

    it(
      'records execution failure and rethrows it',
      async () => {
        const {
          service,
          repository,
        } = createService(null);

        await expect(
          service.execute({
            scope,
            execute:
              async () => {
                throw new Error(
                  'operation failed',
                );
              },
          }),
        ).rejects.toThrow(
          'operation failed',
        );

        expect(
          repository.fail,
        ).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            message:
              'operation failed',
          }),
        );
      },
    );

    it(
      'commits failure persistence before rethrowing',
      async () => {
        const calls:
          string[] = [];

        const started =
          record();

        const failed =
          record({
            status:
              'FAILED',
            errorPayload: {
              message:
                'operation failed',
            },
            completedAt:
              new Date(),
          });

        const repository = {
          executeWithLock:
            jest.fn(
              async (
                _scope:
                  PlatformIdempotencyScope,
                work:
                  (
                    transaction:
                      PlatformIdempotencyTransaction,
                  ) => Promise<unknown>,
              ) => {
                const result =
                  await work({
                    state: null,
                    start:
                      async () => {
                        calls.push(
                          'start',
                        );

                        return started;
                      },
                    complete:
                      async () => {
                        calls.push(
                          'complete',
                        );

                        return record({
                          status:
                            'COMPLETE',
                        });
                      },
                    fail:
                      async () => {
                        calls.push(
                          'fail',
                        );

                        return failed;
                      },
                  });

                calls.push(
                  'commit',
                );

                return result;
              },
            ),
          start:
            jest.fn(),
          complete:
            jest.fn(),
          fail:
            jest.fn(),
          find:
            jest.fn(),
          cleanupExpired:
            jest.fn(),
        };

        const service =
          new PlatformIdempotencyService(
            repository as unknown as
              PlatformIdempotencyRepository,
          );

        await expect(
          service.execute({
            scope,
            execute:
              async () => {
                calls.push(
                  'execute',
                );

                throw new Error(
                  'operation failed',
                );
              },
          }),
        ).rejects.toThrow(
          'operation failed',
        );

        expect(calls).toEqual([
          'start',
          'execute',
          'fail',
          'commit',
        ]);
      },
    );

    it(
      'allows retry after a failed matching request',
      async () => {
        const {
          service,
          repository,
        } = createService(
          record({
            status:
              'FAILED',
            completedAt:
              new Date(),
          }),
        );

        await service.execute({
          scope,
          execute:
            async () => ({
              retried: true,
            }),
        });

        expect(
          repository.start,
        ).toHaveBeenCalledTimes(1);
      },
    );

    it(
      'rejects an unsafe idempotency key',
      async () => {
        const {
          service,
        } = createService(null);

        await expect(
          service.execute({
            scope: {
              ...scope,
              idempotencyKey:
                '../bad',
            },
            execute:
              async () => true,
          }),
        ).rejects.toBeInstanceOf(
          BadRequestException,
        );
      },
    );
  },
);
