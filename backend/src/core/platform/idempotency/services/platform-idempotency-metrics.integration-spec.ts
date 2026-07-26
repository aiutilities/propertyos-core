import {
  ConflictException,
} from '@nestjs/common';
import {
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

import {
  MetricsService,
} from '../../../metrics/services/metrics.service';
import {
  PlatformIdempotencyExecutionOptions,
  PlatformIdempotencyScope,
} from '../platform-idempotency.types';
import {
  PlatformIdempotencyRepository,
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
      'resource-1',
    idempotencyKey:
      'request-key-0001',
    requestFingerprint:
      'a'.repeat(64),
    expiresAt:
      new Date(
        Date.now() + 60_000,
      ),
  };

const metrics = () => ({
  incrementCounter:
    jest.fn(),
  observeHistogram:
    jest.fn(),
});

describe(
  'PlatformIdempotencyService metrics',
  () => {
    it(
      'records requests, fresh execution duration and no replay',
      async () => {
        const repository = {
          executeWithLock:
            jest.fn(
              async (
                _scope:
                  PlatformIdempotencyScope,
                execute:
                  (
                    transaction: any,
                  ) => Promise<any>,
              ) =>
                execute({
                  state:
                    undefined,
                  start:
                    jest.fn(
                      async () => ({
                        id:
                          'record-1',
                      }),
                    ),
                  complete:
                    jest.fn(
                      async (
                        _id: string,
                        completion:
                          Record<
                            string,
                            unknown
                          >,
                      ) => ({
                        id:
                          'record-1',
                        status:
                          'COMPLETE',
                        responsePayload:
                          completion.payload,
                      }),
                    ),
                  fail:
                    jest.fn(),
                }),
            ),
        };

        const metricService =
          metrics();

        const service =
          new PlatformIdempotencyService(
            repository as unknown as
              PlatformIdempotencyRepository,
            metricService as unknown as
              MetricsService,
          );

        const options:
          PlatformIdempotencyExecutionOptions<{
            success: boolean;
          }> = {
            scope,
            execute:
              async () => ({
                success:
                  true,
              }),
          };

        const result =
          await service.execute(
            options,
          );

        expect(
          result.replayed,
        ).toBe(false);

        expect(
          metricService.incrementCounter,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            name:
              'propertyos_idempotency_requests_total',
            labels: {
              operation:
                scope.operation,
            },
          }),
        );

        expect(
          metricService.incrementCounter,
        ).not.toHaveBeenCalledWith(
          expect.objectContaining({
            name:
              'propertyos_idempotency_replays_total',
          }),
        );

        expect(
          metricService.observeHistogram,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            name:
              'propertyos_idempotency_duration_ms',
            labels: {
              operation:
                scope.operation,
            },
            value:
              expect.any(Number),
          }),
        );
      },
    );

    it(
      'records completed replay',
      async () => {
        const repository = {
          executeWithLock:
            jest.fn(
              async () => ({
                succeeded:
                  true,
                result: {
                  replayed:
                    true,
                  value: {
                    success:
                      true,
                  },
                  record: {
                    status:
                      'COMPLETE',
                  },
                },
              }),
            ),
        };

        const metricService =
          metrics();

        const service =
          new PlatformIdempotencyService(
            repository as unknown as
              PlatformIdempotencyRepository,
            metricService as unknown as
              MetricsService,
          );

        await service.execute({
          scope,
          execute:
            async () => ({
              success:
                true,
            }),
        });

        expect(
          metricService.incrementCounter,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            name:
              'propertyos_idempotency_replays_total',
          }),
        );
      },
    );

    it(
      'records conflicts with stable conflict code',
      async () => {
        const repository = {
          executeWithLock:
            jest.fn(
              async () => {
                throw new ConflictException({
                  error:
                    'IDEMPOTENCY_KEY_REUSED',
                });
              },
            ),
        };

        const metricService =
          metrics();

        const service =
          new PlatformIdempotencyService(
            repository as unknown as
              PlatformIdempotencyRepository,
            metricService as unknown as
              MetricsService,
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

        expect(
          metricService.incrementCounter,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            name:
              'propertyos_idempotency_conflicts_total',
            labels: {
              operation:
                scope.operation,
              conflictCode:
                'IDEMPOTENCY_KEY_REUSED',
            },
          }),
        );
      },
    );

    it(
      'records non-conflict failures',
      async () => {
        const repository = {
          executeWithLock:
            jest.fn(
              async () => {
                throw new Error(
                  'execution failed',
                );
              },
            ),
        };

        const metricService =
          metrics();

        const service =
          new PlatformIdempotencyService(
            repository as unknown as
              PlatformIdempotencyRepository,
            metricService as unknown as
              MetricsService,
          );

        await expect(
          service.execute({
            scope,
            execute:
              async () => true,
          }),
        ).rejects.toThrow(
          'execution failed',
        );

        expect(
          metricService.incrementCounter,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            name:
              'propertyos_idempotency_failures_total',
          }),
        );
      },
    );

    it(
      'remains usable without an injected metrics service',
      async () => {
        const repository = {
          executeWithLock:
            jest.fn(
              async () => ({
                succeeded:
                  true,
                result: {
                  replayed:
                    false,
                  value:
                    true,
                  record: {
                    status:
                      'COMPLETE',
                  },
                },
              }),
            ),
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
              async () => true,
          }),
        ).resolves.toMatchObject({
          replayed:
            false,
        });
      },
    );
  },
);
