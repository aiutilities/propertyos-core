import {
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import {
  Pool,
  PoolClient,
} from 'pg';
import {
  PluginInstallationConflictError,
  PluginInstallationCoordinatorService,
} from './plugin-installation-coordinator.service';

type QueryResponse = {
  rows: unknown[];
};

type QueryHandler = (
  text: string,
  values?: unknown[],
) => Promise<QueryResponse>;

const createCoordinator = (
  handler: QueryHandler,
) => {
  const query = jest.fn(handler);
  const release = jest.fn();

  const client = {
    query,
    release,
  } as unknown as PoolClient;

  const pool = {
    connect: jest.fn(async () => client),
  } as unknown as Pool;

  return {
    coordinator:
      new PluginInstallationCoordinatorService(pool),
    query,
    release,
  };
};

describe(
  'PluginInstallationCoordinatorService',
  () => {
    const requestKey = 'a'.repeat(64);

    const handler = (
      storedRows: unknown[] = [],
      acquired = true,
      calls: string[] = [],
    ): QueryHandler =>
      async (text) => {
        calls.push(text);

        if (text.includes('pg_try_advisory_lock')) {
          return {
            rows: [{ acquired }],
          };
        }

        if (
          text.includes(
            'FROM core_plugin_installation_attempts',
          )
        ) {
          return {
            rows: storedRows,
          };
        }

        return {
          rows: [],
        };
      };

    it(
      'records and returns successful work',
      async () => {
        const calls: string[] = [];
        const {
          coordinator,
          release,
        } = createCoordinator(handler([], true, calls));

        await expect(
          coordinator.coordinate(
            requestKey,
            async () => ({
              success: true,
              pluginId: 'plugin-1',
            }),
            (value) => value.success,
          ),
        ).resolves.toEqual({
          replayed: false,
          value: {
            success: true,
            pluginId: 'plugin-1',
          },
        });

        expect(
          calls.some((text) =>
            text.includes("VALUES ($1, 'RUNNING')")),
        ).toBe(true);

        expect(
          calls.some((text) =>
            text.includes("status = 'COMPLETE'")),
        ).toBe(true);

        expect(
          calls.some((text) =>
            text.includes('pg_advisory_unlock')),
        ).toBe(true);

        expect(release).toHaveBeenCalledTimes(1);
      },
    );

    it(
      'replays a completed result',
      async () => {
        const operation = jest.fn(
          async () => ({
            success: true,
          }),
        );

        const { coordinator } =
          createCoordinator(
            handler([
              {
                status: 'COMPLETE',
                result: {
                  success: true,
                  pluginId: 'existing',
                },
              },
            ]),
          );

        await expect(
          coordinator.coordinate(
            requestKey,
            operation,
          ),
        ).resolves.toEqual({
          replayed: true,
          value: {
            success: true,
            pluginId: 'existing',
          },
        });

        expect(operation).not.toHaveBeenCalled();
      },
    );

    it(
      'rejects concurrent work',
      async () => {
        const {
          coordinator,
          release,
        } = createCoordinator(
          handler([], false),
        );

        await expect(
          coordinator.coordinate(
            requestKey,
            async () => true,
          ),
        ).rejects.toBeInstanceOf(
          PluginInstallationConflictError,
        );

        expect(release).toHaveBeenCalledTimes(1);
      },
    );

    it(
      'records unsuccessful results as failed',
      async () => {
        const calls: string[] = [];
        const { coordinator } =
          createCoordinator(handler([], true, calls));

        await expect(
          coordinator.coordinate(
            requestKey,
            async () => ({
              success: false,
            }),
            (value) => value.success,
          ),
        ).resolves.toEqual({
          replayed: false,
          value: {
            success: false,
          },
        });

        expect(
          calls.some((text) =>
            text.includes("status = 'FAILED'")),
        ).toBe(true);
      },
    );

    it(
      'records thrown failures and releases its lock',
      async () => {
        const calls: string[] = [];
        const {
          coordinator,
          release,
        } = createCoordinator(
          handler([], true, calls),
        );

        await expect(
          coordinator.coordinate(
            requestKey,
            async () => {
              throw new Error('installation exploded');
            },
          ),
        ).rejects.toThrow('installation exploded');

        expect(
          calls.some((text) =>
            text.includes("status = 'FAILED'")),
        ).toBe(true);

        expect(
          calls.some((text) =>
            text.includes('pg_advisory_unlock')),
        ).toBe(true);

        expect(release).toHaveBeenCalledTimes(1);
      },
    );

    it(
      'rejects invalid request keys before connecting',
      async () => {
        const {
          coordinator,
          query,
          release,
        } = createCoordinator(handler());

        await expect(
          coordinator.coordinate(
            '../unsafe',
            async () => true,
          ),
        ).rejects.toThrow(
          'must be a lowercase SHA-256 digest',
        );

        expect(query).not.toHaveBeenCalled();
        expect(release).not.toHaveBeenCalled();
      },
    );
  },
);
