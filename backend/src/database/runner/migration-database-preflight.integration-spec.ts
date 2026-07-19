import {
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import {
  QueryResult,
} from 'pg';
import {
  ReadOnlyQueryExecutor,
  runDatabasePreflight,
} from './migration-database-preflight';
import {
  CONTROLLED_DEPLOYMENT_MIGRATIONS,
} from './migration-readiness';

function result<T extends Record<string, unknown>>(
  rows: T[],
): QueryResult<T> {
  return {
    command: 'SELECT',
    rowCount: rows.length,
    oid: 0,
    fields: [],
    rows,
  };
}

const controlledNames =
  CONTROLLED_DEPLOYMENT_MIGRATIONS.map(
    (migration) => migration.name,
  );

const repositoryNames = [
  'core/001-baseline.sql',
  ...controlledNames,
];

const requiredRelations = [
  'schema_migrations',
  'core_plugins',
  'storage_objects',
];

function executorFor(options?: {
  applied?: string[];
  targetPresent?: string[];
  versionNumber?: string;
}): ReadOnlyQueryExecutor {
  const applied =
    options?.applied ?? ['core/001-baseline.sql'];
  const targetPresent =
    new Set(options?.targetPresent ?? []);
  const versionNumber =
    options?.versionNumber ?? '160014';

  const query = jest.fn(
    async (text: string) => {
        if (text.includes('current_database()')) {
          return result([
            {
              database: 'propertyos',
              database_user: 'propertyos',
              server_version_num: versionNumber,
              in_recovery: false,
            },
          ]);
        }

        if (text.includes('to_regclass')) {
          const targets = [
            'core_plugin_installation_attempts',
            'plugin_publishers',
            'plugin_publisher_keys',
            'plugin_publications',
            'plugin_publication_security_events',
            'plugin_publisher_trust_security_events',
          ];

          return result([
            ...requiredRelations.map(
              (relation_name) => ({
                relation_name,
                present: true,
              }),
            ),
            ...targets.map((relation_name) => ({
              relation_name,
              present:
                targetPresent.has(relation_name),
            })),
          ]);
        }

        if (
          text.includes(
            'FROM schema_migrations',
          )
        ) {
          return result(
            applied.map((name) => ({ name })),
          );
        }

        if (text.includes('FROM core_plugins')) {
          return result([{ count: '1' }]);
        }

        throw new Error(
          `Unexpected query: ${text}`,
        );
    },
  );

  return {
    query:
      query as unknown as
        ReadOnlyQueryExecutor['query'],
  };
}

describe('Phase 13D database preflight', () => {
  it('accepts only the controlled pending range', async () => {
    const report = await runDatabasePreflight(
      executorFor(),
      repositoryNames,
    );

    expect(report.status).toBe('READY');
    expect(report.databaseQueried).toBe(true);
    expect(report.databaseMutated).toBe(false);
    expect(report.applyAuthorized).toBe(false);
    expect(report.pendingRepositoryMigrations)
      .toEqual(controlledNames);
    expect(report.unexpectedPendingMigrations)
      .toEqual([]);
    expect(report.corePluginCount).toBe(1);
  });

  it('blocks an earlier unexpected pending migration', async () => {
    const names = [
      'core/001-baseline.sql',
      'core/037-prerequisite.sql',
      ...controlledNames,
    ];

    const report = await runDatabasePreflight(
      executorFor(),
      names,
    );

    expect(report.status).toBe('BLOCKED');
    expect(report.unexpectedPendingMigrations)
      .toEqual(['core/037-prerequisite.sql']);
    expect(report.errors[0]).toContain(
      'Unexpected pending migrations',
    );
  });

  it('blocks schema drift when target tables exist', async () => {
    const report = await runDatabasePreflight(
      executorFor({
        targetPresent: ['plugin_publishers'],
      }),
      repositoryNames,
    );

    expect(report.status).toBe('BLOCKED');
    expect(report.targetObjectsPresent)
      .toEqual(['plugin_publishers']);
  });

  it('blocks controlled migrations already applied', async () => {
    const report = await runDatabasePreflight(
      executorFor({
        applied: [
          'core/001-baseline.sql',
          controlledNames[0],
        ],
      }),
      repositoryNames,
    );

    expect(report.status).toBe('BLOCKED');
    expect(report.appliedControlledMigrations)
      .toEqual([controlledNames[0]]);
  });

  it('blocks unsupported PostgreSQL versions', async () => {
    const report = await runDatabasePreflight(
      executorFor({
        versionNumber: '150010',
      }),
      repositoryNames,
    );

    expect(report.status).toBe('BLOCKED');
    expect(report.server.majorVersion).toBe(15);
    expect(report.errors).toContain(
      'PostgreSQL 16 required; detected 15',
    );
  });

  it('blocks applied migrations absent from source', async () => {
    const report = await runDatabasePreflight(
      executorFor({
        applied: [
          'core/001-baseline.sql',
          'core/retired-migration.sql',
        ],
      }),
      repositoryNames,
    );

    expect(report.status).toBe('BLOCKED');
    expect(
      report.appliedMigrationsAbsentFromRepository,
    ).toEqual(['core/retired-migration.sql']);
  });
});
