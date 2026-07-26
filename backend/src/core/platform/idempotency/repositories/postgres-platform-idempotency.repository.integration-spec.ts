import {
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import {
  Pool,
  PoolClient,
  QueryResult,
} from 'pg';

import {
  PostgresPlatformIdempotencyRepository,
} from './postgres-platform-idempotency.repository';

interface QueryResponse {
  rows: unknown[];
  rowCount?: number;
}

type QueryHandler =
  (
    text: string,
    values?: unknown[],
  ) => Promise<QueryResponse>;

const createClient = (
  handler:
    QueryHandler,
) => {
  const query =
    jest.fn(
      handler,
    );

  const release =
    jest.fn(
      () => undefined,
    );

  return {
    client: {
      query,
      release,
    } as unknown as
      PoolClient,
    query,
    release,
  };
};

describe(
  'PostgresPlatformIdempotencyRepository',
  () => {
    it(
      'uses a transaction-scoped advisory lock',
      async () => {
        const calls:
          string[] = [];

        const {
          client,
          release,
        } = createClient(
          async (
            text: string,
          ) => {
            calls.push(text);

            return {
              rows: [],
            };
          },
        );

        const pool = {
          connect:
            jest.fn(
              async () =>
                client,
            ),
        } as unknown as Pool;

        const repository =
          new PostgresPlatformIdempotencyRepository(
            pool,
          );

        await repository.executeWithLock(
          {
            actorId:
              'actor',
            operation:
              'operation',
            resourceKey:
              'resource',
            idempotencyKey:
              'request-key',
            requestFingerprint:
              'a'.repeat(64),
            expiresAt:
              new Date(
                Date.now() +
                60_000,
              ),
          },
          async (
            transaction,
          ) => {
            expect(
              transaction.state,
            ).toBeNull();

            return 'done';
          },
        );

        expect(calls).toEqual(
          expect.arrayContaining([
            'BEGIN',
            expect.stringContaining(
              'pg_advisory_xact_lock',
            ),
            expect.stringContaining(
              'FROM core_idempotency_requests',
            ),
            'COMMIT',
          ]),
        );

        expect(
          release,
        ).toHaveBeenCalledTimes(1);
      },
    );

    it(
      'rolls back and releases the connection when work fails',
      async () => {
        const calls:
          string[] = [];

        const {
          client,
          release,
        } = createClient(
          async (
            text: string,
          ) => {
            calls.push(text);

            return {
              rows: [],
            };
          },
        );

        const pool = {
          connect:
            jest.fn(
              async () =>
                client,
            ),
        } as unknown as Pool;

        const repository =
          new PostgresPlatformIdempotencyRepository(
            pool,
          );

        await expect(
          repository.executeWithLock(
            {
              actorId:
                'actor',
              operation:
                'operation',
              resourceKey:
                'resource',
              idempotencyKey:
                'request-key',
              requestFingerprint:
                'a'.repeat(64),
              expiresAt:
                new Date(
                  Date.now() +
                  60_000,
                ),
            },
            async () => {
              throw new Error(
                'failed',
              );
            },
          ),
        ).rejects.toThrow(
          'failed',
        );

        expect(calls).toContain(
          'ROLLBACK',
        );

        expect(
          release,
        ).toHaveBeenCalledTimes(1);
      },
    );

    it(
      'cleans only expired non-running requests',
      async () => {
        const calls:
          Array<{
            text: string;
            values?: unknown[];
          }> = [];

        const pool = {
          query:
            jest.fn(
              async (
                text: string,
                values?: unknown[],
              ): Promise<
                QueryResult<never>
              > => {
                calls.push({
                  text,
                  values,
                });

                return {
                  command:
                    'DELETE',
                  rowCount:
                    3,
                  oid:
                    0,
                  fields: [],
                  rows: [],
                };
              },
            ),
        } as unknown as Pool;

        const repository =
          new PostgresPlatformIdempotencyRepository(
            pool,
          );

        await expect(
          repository.cleanupExpired(
            new Date(),
          ),
        ).resolves.toBe(3);

        expect(
          calls[0]?.text,
        ).toContain(
          "status <> 'RUNNING'",
        );
      },
    );
  },
);
