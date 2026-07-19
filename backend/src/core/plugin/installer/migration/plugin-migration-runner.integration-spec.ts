import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from '@jest/globals';
import {
  createHash,
} from 'crypto';
import {
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from 'fs';
import {
  tmpdir,
} from 'os';
import {
  join,
} from 'path';
import {
  Pool,
  PoolClient,
} from 'pg';
import {
  PluginMigrationRunnerService,
} from './plugin-migration-runner.service';

describe(
  'PluginMigrationRunnerService reversible migrations',
  () => {
    let workspace: string;
    let pluginRoot: string;
    let migrationsRoot: string;

    beforeEach(() => {
      workspace =
        mkdtempSync(
          join(
            tmpdir(),
            'propertyos-plugin-migrations-',
          ),
        );

      pluginRoot =
        join(
          workspace,
          'example-plugin',
        );

      migrationsRoot =
        join(
          pluginRoot,
          'migrations',
        );

      mkdirSync(
        migrationsRoot,
        {
          recursive: true,
        },
      );
    });

    afterEach(() => {
      rmSync(
        workspace,
        {
          recursive: true,
          force: true,
        },
      );
    });

    const writePair = (
      name: string,
      upSql: string,
      downSql: string,
    ) => {
      writeFileSync(
        join(
          migrationsRoot,
          `${name}.up.sql`,
        ),
        upSql,
      );

      writeFileSync(
        join(
          migrationsRoot,
          `${name}.down.sql`,
        ),
        downSql,
      );
    };

    const checksum = (
      sql: string,
    ) =>
      createHash('sha256')
        .update(sql)
        .digest('hex');

    it(
      'does nothing when no migrations executed',
      async () => {
        const pool = {} as Pool;
        const runner =
          new PluginMigrationRunnerService(
            pool,
          );

        await expect(
          runner.rollback([]),
        ).resolves.toBeUndefined();
      },
    );

    it(
      'refuses rollback without verified package context',
      async () => {
        const pool = {} as Pool;
        const runner =
          new PluginMigrationRunnerService(
            pool,
          );

        await expect(
          runner.rollback([
            'plugins/example/001-create-table.up.sql',
          ]),
        ).rejects.toThrow(
          'PLUGIN_MIGRATION_ROLLBACK_UNAVAILABLE',
        );
      },
    );

    it(
      'runs a paired up migration transactionally and records integrity',
      async () => {
        const upSql =
          'CREATE TABLE reversible_example (id INTEGER);';

        const downSql =
          'DROP TABLE reversible_example;';

        writePair(
          '001-create-example',
          upSql,
          downSql,
        );

        const clientCalls:
          Array<{
            text: string;
            values?: unknown[];
          }> = [];

        const poolCalls:
          Array<{
            text: string;
            values?: unknown[];
          }> = [];

        const client = {
          query:
            async (
              text: string,
              values?: unknown[],
            ) => {
              clientCalls.push({
                text,
                values,
              });

              if (
                text.includes(
                  'FROM schema_migrations',
                )
              ) {
                return {
                  rows: [],
                };
              }

              return {
                rows: [],
              };
            },
          release:
            () => undefined,
        } as unknown as PoolClient;

        const pool = {
          query:
            async (
              text: string,
              values?: unknown[],
            ) => {
              poolCalls.push({
                text,
                values,
              });

              if (
                text.includes(
                  'FROM schema_migrations',
                )
              ) {
                return {
                  rows: [],
                };
              }

              return {
                rows: [],
              };
            },
          connect:
            async () =>
              client,
        } as unknown as Pool;

        const runner =
          new PluginMigrationRunnerService(
            pool,
          );

        await expect(
          runner.run(
            pluginRoot,
            'example',
            '1.0.0',
          ),
        ).resolves.toEqual({
          executed: [
            'plugins/example/001-create-example.up.sql',
          ],
          skipped: [],
        });

        expect(
          clientCalls.some(
            (call) =>
              call.text === upSql,
          ),
        ).toBe(true);

        const insert =
          clientCalls.find(
            (call) =>
              call.text.includes(
                'INSERT INTO schema_migrations',
              ),
          );

        expect(insert?.values).toEqual([
          'plugins/example/001-create-example.up.sql',
          checksum(upSql),
          checksum(downSql),
          'example',
          '1.0.0',
        ]);

        expect(
          clientCalls.some(
            (call) =>
              call.text ===
                'COMMIT',
          ),
        ).toBe(true);

        expect(
          poolCalls.some(
            (call) =>
              call.text.includes(
                'CREATE TABLE IF NOT EXISTS schema_migrations',
              ),
          ),
        ).toBe(true);
      },
    );

    it(
      'rolls paired migrations back in reverse order',
      async () => {
        const firstUp =
          'SELECT 101;';
        const firstDown =
          'SELECT 102;';
        const secondUp =
          'SELECT 201;';
        const secondDown =
          'SELECT 202;';

        writePair(
          '001-first',
          firstUp,
          firstDown,
        );

        writePair(
          '002-second',
          secondUp,
          secondDown,
        );

        const calls: string[] = [];

        const client = {
          query:
            async (
              text: string,
              values?: unknown[],
            ) => {
              calls.push(text);

              if (
                text.includes(
                  'FROM schema_migrations',
                )
              ) {
                const name =
                  String(
                    values?.[0],
                  );

                const upSql =
                  name.includes(
                    '001-first',
                  )
                    ? firstUp
                    : secondUp;

                return {
                  rows: [
                    {
                      checksum:
                        checksum(
                          upSql,
                        ),
                      reversible:
                        true,
                    },
                  ],
                };
              }

              return {
                rows: [],
              };
            },
          release:
            () => undefined,
        } as unknown as PoolClient;

        const pool = {
          connect:
            async () =>
              client,
        } as unknown as Pool;

        const runner =
          new PluginMigrationRunnerService(
            pool,
          );

        await runner.rollback(
          [
            'plugins/example/001-first.up.sql',
            'plugins/example/002-second.up.sql',
          ],
          pluginRoot,
          'example',
        );

        expect(
          calls.indexOf(
            secondDown,
          ),
        ).toBeLessThan(
          calls.indexOf(
            firstDown,
          ),
        );

        expect(
          calls.filter(
            (text) =>
              text.includes(
                'DELETE FROM schema_migrations',
              ),
          ),
        ).toHaveLength(2);
      },
    );

    it(
      'rejects an up migration without a matching down migration',
      async () => {
        writeFileSync(
          join(
            migrationsRoot,
            '001-unpaired.up.sql',
          ),
          'SELECT 1;',
        );

        const pool = {
          query:
            async (
              text: string,
            ) => {
              if (
                text.includes(
                  'FROM schema_migrations',
                )
              ) {
                return {
                  rows: [],
                };
              }

              return {
                rows: [],
              };
            },
          connect:
            async () => {
              throw new Error(
                'Connection must not be acquired for an unpaired migration',
              );
            },
        } as unknown as Pool;

        const runner =
          new PluginMigrationRunnerService(
            pool,
          );

        await expect(
          runner.run(
            pluginRoot,
            'example',
            '1.0.0',
          ),
        ).rejects.toThrow(
          'PLUGIN_MIGRATION_DOWN_REQUIRED',
        );
      },
    );

    it(
      'rejects checksum drift for an applied migration',
      async () => {
        writePair(
          '001-drift',
          'SELECT 1;',
          'SELECT 2;',
        );

        const pool = {
          query:
            async (
              text: string,
            ) => {
              if (
                text.includes(
                  'FROM schema_migrations',
                )
              ) {
                return {
                  rows: [
                    {
                      checksum:
                        'f'.repeat(64),
                      reversible:
                        true,
                    },
                  ],
                };
              }

              return {
                rows: [],
              };
            },
          connect:
            async () => {
              throw new Error(
                'Connection must not be acquired after checksum drift',
              );
            },
        } as unknown as Pool;

        const runner =
          new PluginMigrationRunnerService(
            pool,
          );

        await expect(
          runner.run(
            pluginRoot,
            'example',
            '1.0.0',
          ),
        ).rejects.toThrow(
          'PLUGIN_MIGRATION_CHECKSUM_MISMATCH',
        );
      },
    );

    it(
      'rejects legacy unpaired migrations before execution',
      async () => {
        writeFileSync(
          join(
            migrationsRoot,
            '001-legacy.sql',
          ),
          'SELECT 1;',
        );

        const pool = {
          query:
            async (
              text: string,
            ) => {
              if (
                text.includes(
                  'FROM schema_migrations',
                )
              ) {
                return {
                  rows: [],
                };
              }

              return {
                rows: [],
              };
            },
          connect:
            async () => {
              throw new Error(
                'Legacy migration must not execute',
              );
            },
        } as unknown as Pool;

        const runner =
          new PluginMigrationRunnerService(
            pool,
          );

        await expect(
          runner.run(
            pluginRoot,
            'example',
            '1.0.0',
          ),
        ).rejects.toThrow(
          'PLUGIN_MIGRATION_DOWN_REQUIRED',
        );
      },
    );
  },
);
