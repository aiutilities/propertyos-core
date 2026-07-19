import { QueryResult } from 'pg';
import {
  CONTROLLED_PLUGIN_TRUST_MIGRATIONS,
} from './migration-readiness';

export interface ReadOnlyQueryExecutor {
  query<T extends Record<string, unknown> = Record<string, unknown>>(
    text: string,
    values?: unknown[],
  ): Promise<QueryResult<T>>;
}

export interface DatabasePreflightReport {
  status: 'READY' | 'BLOCKED';
  scope: 'PHASE_13D_DATABASE_PREFLIGHT';
  databaseQueried: true;
  databaseMutated: false;
  applyAuthorized: false;
  server: {
    database: string | null;
    user: string | null;
    versionNumber: number | null;
    majorVersion: number | null;
    inRecovery: boolean | null;
  };
  prerequisites: Record<string, boolean>;
  targetObjectsPresent: string[];
  appliedControlledMigrations: string[];
  pendingRepositoryMigrations: string[];
  unexpectedPendingMigrations: string[];
  appliedMigrationsAbsentFromRepository: string[];
  schemaMigrationCount: number | null;
  corePluginCount: number | null;
  errors: string[];
}

const REQUIRED_RELATIONS = [
  'schema_migrations',
  'core_plugins',
  'storage_objects',
] as const;

const TARGET_RELATIONS = [
  'core_plugin_installation_attempts',
  'plugin_publishers',
  'plugin_publisher_keys',
  'plugin_publications',
  'plugin_publication_security_events',
  'plugin_publisher_trust_security_events',
] as const;

function numericValue(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function runDatabasePreflight(
  executor: ReadOnlyQueryExecutor,
  repositoryMigrationNames: readonly string[],
): Promise<DatabasePreflightReport> {
  const errors: string[] = [];

  const serverResult = await executor.query<{
    database: string;
    database_user: string;
    server_version_num: string;
    in_recovery: boolean;
  }>(`
    SELECT
      current_database() AS database,
      current_user AS database_user,
      current_setting('server_version_num')
        AS server_version_num,
      pg_is_in_recovery() AS in_recovery
  `);

  const serverRow = serverResult.rows[0];
  const versionNumber = numericValue(
    serverRow?.server_version_num,
  );
  const majorVersion = versionNumber === null
    ? null
    : Math.floor(versionNumber / 10000);

  if (majorVersion !== 16) {
    errors.push(
      `PostgreSQL 16 required; detected ${
        majorVersion ?? 'unknown'
      }`,
    );
  }

  const relationNames = [
    ...REQUIRED_RELATIONS,
    ...TARGET_RELATIONS,
  ];

  const relationResult = await executor.query<{
    relation_name: string;
    present: boolean;
  }>(`
    SELECT
      relation_name,
      to_regclass(
        'public.' || relation_name
      ) IS NOT NULL AS present
    FROM unnest($1::text[]) AS relation_name
    ORDER BY relation_name
  `, [relationNames]);

  const relationPresence = new Map(
    relationResult.rows.map((row) => [
      row.relation_name,
      row.present,
    ]),
  );

  const prerequisites: Record<string, boolean> = {};

  for (const relation of REQUIRED_RELATIONS) {
    const present =
      relationPresence.get(relation) === true;

    prerequisites[relation] = present;

    if (!present) {
      errors.push(
        `Required relation missing: ${relation}`,
      );
    }
  }

  const targetObjectsPresent = TARGET_RELATIONS.filter(
    (relation) =>
      relationPresence.get(relation) === true,
  );

  if (targetObjectsPresent.length > 0) {
    errors.push(
      'Controlled target relations already present: ' +
        targetObjectsPresent.join(', '),
    );
  }

  let appliedControlledMigrations: string[] = [];
  let pendingRepositoryMigrations: string[] = [];
  let unexpectedPendingMigrations: string[] = [];
  let appliedMigrationsAbsentFromRepository: string[] = [];
  let schemaMigrationCount: number | null = null;

  if (prerequisites.schema_migrations) {
    const migrationResult = await executor.query<{
      name: string;
    }>(`
      SELECT name
      FROM schema_migrations
      ORDER BY name
    `);

    const appliedNames = migrationResult.rows.map(
      (row) => row.name,
    );
    const appliedSet = new Set(appliedNames);
    const repositorySet = new Set(
      repositoryMigrationNames,
    );
    const controlledSet = new Set(
      CONTROLLED_PLUGIN_TRUST_MIGRATIONS.map(
        (migration) => migration.name,
      ),
    );

    appliedControlledMigrations =
      appliedNames.filter((name) =>
        controlledSet.has(name),
      );

    pendingRepositoryMigrations =
      repositoryMigrationNames.filter(
        (name) => !appliedSet.has(name),
      );

    unexpectedPendingMigrations =
      pendingRepositoryMigrations.filter(
        (name) => !controlledSet.has(name),
      );

    appliedMigrationsAbsentFromRepository =
      appliedNames.filter(
        (name) => !repositorySet.has(name),
      );

    schemaMigrationCount = appliedNames.length;

    if (appliedControlledMigrations.length > 0) {
      errors.push(
        'Controlled migrations already applied: ' +
          appliedControlledMigrations.join(', '),
      );
    }

    if (unexpectedPendingMigrations.length > 0) {
      errors.push(
        'Unexpected pending migrations outside ' +
          'the controlled rollout: ' +
          unexpectedPendingMigrations.join(', '),
      );
    }

    if (
      appliedMigrationsAbsentFromRepository.length > 0
    ) {
      errors.push(
        'Applied migrations absent from repository: ' +
          appliedMigrationsAbsentFromRepository.join(', '),
      );
    }
  }

  let corePluginCount: number | null = null;

  if (prerequisites.core_plugins) {
    const pluginCountResult = await executor.query<{
      count: string;
    }>(
      'SELECT COUNT(*)::text AS count ' +
        'FROM core_plugins',
    );

    corePluginCount = numericValue(
      pluginCountResult.rows[0]?.count,
    );
  }

  return {
    status: errors.length === 0
      ? 'READY'
      : 'BLOCKED',
    scope: 'PHASE_13D_DATABASE_PREFLIGHT',
    databaseQueried: true,
    databaseMutated: false,
    applyAuthorized: false,
    server: {
      database: serverRow?.database ?? null,
      user: serverRow?.database_user ?? null,
      versionNumber,
      majorVersion,
      inRecovery: serverRow?.in_recovery ?? null,
    },
    prerequisites,
    targetObjectsPresent: [...targetObjectsPresent],
    appliedControlledMigrations,
    pendingRepositoryMigrations,
    unexpectedPendingMigrations,
    appliedMigrationsAbsentFromRepository,
    schemaMigrationCount,
    corePluginCount,
    errors,
  };
}
