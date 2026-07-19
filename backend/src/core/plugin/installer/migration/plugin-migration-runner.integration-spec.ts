import {
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import {
  Pool,
} from 'pg';
import {
  PluginMigrationRunnerService,
} from './plugin-migration-runner.service';

describe(
  'PluginMigrationRunnerService rollback safety',
  () => {
    it(
      'does nothing when no migrations executed',
      async () => {
        const query = jest.fn();
        const pool = {
          query,
        } as unknown as Pool;

        const runner =
          new PluginMigrationRunnerService(
            pool,
          );

        await expect(
          runner.rollback([]),
        ).resolves.toBeUndefined();

        expect(query).not.toHaveBeenCalled();
      },
    );

    it(
      'refuses false rollback and preserves migration history',
      async () => {
        const query = jest.fn();
        const pool = {
          query,
        } as unknown as Pool;

        const runner =
          new PluginMigrationRunnerService(
            pool,
          );

        await expect(
          runner.rollback([
            'plugins/example/001-create-table.sql',
          ]),
        ).rejects.toThrow(
          'PLUGIN_MIGRATION_ROLLBACK_UNAVAILABLE',
        );

        expect(query).not.toHaveBeenCalled();
      },
    );
  },
);
