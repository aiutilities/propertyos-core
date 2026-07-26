import {
  ConflictException,
} from '@nestjs/common';
import {
  afterAll,
  beforeAll,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import {
  Pool,
} from 'pg';

import {
  PostgresPlatformIdempotencyRepository,
} from './repositories/postgres-platform-idempotency.repository';
import {
  PlatformIdempotencyFingerprintService,
} from './services/platform-idempotency-fingerprint.service';
import {
  PlatformIdempotencyService,
} from './services/platform-idempotency.service';

describe(
  'Platform idempotency PostgreSQL integration',
  () => {
    const pool =
      new Pool({
        host:
          process.env.DB_HOST ??
          '127.0.0.1',
        port:
          Number(
            process.env.DB_PORT ??
            5433,
          ),
        user:
          process.env.DB_USER ??
          'propertyos',
        password:
          process.env.DB_PASSWORD ??
          'propertyos',
        database:
          process.env.DB_NAME ??
          'propertyos',
        max:
          1,
      });

    const repository =
      new PostgresPlatformIdempotencyRepository(
        pool,
      );

    const service =
      new PlatformIdempotencyService(
        repository,
      );

    const fingerprint =
      new PlatformIdempotencyFingerprintService();

    const actorId =
      `idempotency-acceptance-${Date.now()}`;

    const expiresAt = () =>
      new Date(
        Date.now() +
        60 * 60 * 1000,
      );

    const scope = (
      key: string,
      request: unknown,
      resourceKey =
        'resource:test:1',
    ) => ({
      actorId,
      operation:
        'platform.acceptance.operation',
      resourceKey,
      idempotencyKey:
        key,
      requestFingerprint:
        fingerprint.fingerprint(
          request,
        ),
      expiresAt:
        expiresAt(),
    });

    beforeAll(
      async () => {
        await pool.query(
          `
          DELETE FROM core_idempotency_requests
          WHERE actor_id = $1
          `,
          [
            actorId,
          ],
        );
      },
    );

    afterAll(
      async () => {
        await pool.query(
          `
          DELETE FROM core_idempotency_requests
          WHERE actor_id = $1
          `,
          [
            actorId,
          ],
        );

        await pool.end();
      },
    );

    it(
      'persists and replays a completed response exactly once',
      async () => {
        const execute =
          jest.fn(
            async () => ({
              success: true,
              value: 42,
            }),
          );

        const requestScope =
          scope(
            'postgres-request-0001',
            {
              value: 42,
            },
          );

        const first =
          await service.execute({
            scope:
              requestScope,
            execute,
            statusCode:
              201,
          });

        const replay =
          await service.execute({
            scope:
              requestScope,
            execute,
            statusCode:
              201,
          });

        expect(
          first.replayed,
        ).toBe(false);

        expect(
          replay,
        ).toMatchObject({
          replayed:
            true,
          value: {
            success:
              true,
            value:
              42,
          },
        });

        expect(
          execute,
        ).toHaveBeenCalledTimes(1);

        const stored =
          await repository.find(
            actorId,
            requestScope.operation,
            requestScope.idempotencyKey,
          );

        expect(
          stored,
        ).toMatchObject({
          status:
            'COMPLETE',
          responseStatus:
            201,
          attemptNumber:
            1,
          responsePayload: {
            success:
              true,
            value:
              42,
          },
        });
      },
    );

    it(
      'rejects reuse of a key with different request data',
      async () => {
        const key =
          'postgres-request-0002';

        await service.execute({
          scope:
            scope(
              key,
              {
                version:
                  '1.0.0',
              },
            ),
          execute:
            async () => ({
              installed:
                true,
            }),
        });

        await expect(
          service.execute({
            scope:
              scope(
                key,
                {
                  version:
                    '2.0.0',
                },
              ),
            execute:
              async () => ({
                installed:
                  false,
              }),
          }),
        ).rejects.toBeInstanceOf(
          ConflictException,
        );
      },
    );

    it(
      'persists failure and permits a controlled retry',
      async () => {
        const key =
          'postgres-request-0003';

        const requestScope =
          scope(
            key,
            {
              retry:
                true,
            },
          );

        await expect(
          service.execute({
            scope:
              requestScope,
            execute:
              async () => {
                throw new Error(
                  'intentional failure',
                );
              },
          }),
        ).rejects.toThrow(
          'intentional failure',
        );

        const failed =
          await repository.find(
            actorId,
            requestScope.operation,
            key,
          );

        expect(
          failed,
        ).toMatchObject({
          status:
            'FAILED',
          attemptNumber:
            1,
          errorPayload:
            expect.objectContaining({
              message:
                'intentional failure',
            }),
        });

        const retry =
          await service.execute({
            scope:
              requestScope,
            execute:
              async () => ({
                recovered:
                  true,
              }),
          });

        expect(
          retry.replayed,
        ).toBe(false);

        const completed =
          await repository.find(
            actorId,
            requestScope.operation,
            key,
          );

        expect(
          completed,
        ).toMatchObject({
          status:
            'COMPLETE',
          attemptNumber:
            2,
          responsePayload: {
            recovered:
              true,
          },
        });
      },
    );

    it(
      'recovers a stale RUNNING record',
      async () => {
        const key =
          'postgres-request-0004';

        const requestScope =
          scope(
            key,
            {
              stale:
                true,
            },
          );

        const started =
          await repository.start(
            requestScope,
          );

        await pool.query(
          `
          UPDATE core_idempotency_requests
          SET
            heartbeat_at =
              NOW() - INTERVAL '10 minutes',
            updated_at =
              NOW() - INTERVAL '10 minutes'
          WHERE id = $1
          `,
          [
            started.id,
          ],
        );

        const result =
          await service.execute({
            scope:
              requestScope,
            execute:
              async () => ({
                recovered:
                  true,
              }),
          });

        expect(
          result.replayed,
        ).toBe(false);

        const stored =
          await repository.find(
            actorId,
            requestScope.operation,
            key,
          );

        expect(
          stored,
        ).toMatchObject({
          status:
            'COMPLETE',
          attemptNumber:
            2,
        });
      },
    );

    it(
      'deletes expired completed records but preserves running records',
      async () => {
        const completedKey =
          'postgres-request-0005';

        const runningKey =
          'postgres-request-0006';

        await service.execute({
          scope:
            scope(
              completedKey,
              {
                cleanup:
                  'complete',
              },
            ),
          execute:
            async () => ({
              complete:
                true,
            }),
        });

        await repository.start(
          scope(
            runningKey,
            {
              cleanup:
                'running',
            },
          ),
        );

        await pool.query(
          `
          UPDATE core_idempotency_requests
          SET
            created_at =
              NOW() - INTERVAL '2 hours',
            started_at =
              NOW() - INTERVAL '2 hours',
            heartbeat_at =
              NOW() - INTERVAL '90 minutes',
            updated_at =
              NOW() - INTERVAL '90 minutes',
            expires_at =
              NOW() - INTERVAL '1 hour'
          WHERE actor_id = $1
            AND idempotency_key IN (
              $2,
              $3
            )
          `,
          [
            actorId,
            completedKey,
            runningKey,
          ],
        );

        const deleted =
          await repository.cleanupExpired(
            new Date(),
          );

        expect(
          deleted,
        ).toBeGreaterThanOrEqual(1);

        const completed =
          await repository.find(
            actorId,
            'platform.acceptance.operation',
            completedKey,
          );

        const running =
          await repository.find(
            actorId,
            'platform.acceptance.operation',
            runningKey,
          );

        expect(
          completed,
        ).toBeNull();

        expect(
          running,
        ).toMatchObject({
          status:
            'RUNNING',
        });
      },
    );
  },
);
