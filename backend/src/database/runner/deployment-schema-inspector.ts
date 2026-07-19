import {
  QueryResult,
} from 'pg';
import {
  SchemaAcceptanceResult,
  SchemaAcceptanceSnapshot,
  validateSchemaAcceptance,
} from './deployment-schema-acceptance';

export interface SchemaInspectionQueryExecutor {
  query<
    T extends Record<string, unknown> =
      Record<string, unknown>
  >(
    text: string,
    values?: unknown[],
  ): Promise<QueryResult<T>>;
}

export interface SchemaInspectionReport {
  databaseQueried: true;
  databaseMutated: false;
  snapshot: SchemaAcceptanceSnapshot;
  acceptance: SchemaAcceptanceResult;
}

function stringValues(
  rows: Record<string, unknown>[],
  field: string,
): string[] {
  return rows
    .map((row) => String(row[field]))
    .sort();
}

export async function inspectDeploymentSchema(
  executor: SchemaInspectionQueryExecutor,
  corePluginCountBefore: number,
): Promise<SchemaInspectionReport> {
  const migrationResult =
    await executor.query<{
      name: string;
    }>(`
      SELECT name
      FROM schema_migrations
      ORDER BY name
    `);

  const relationResult =
    await executor.query<{
      object_name: string;
    }>(`
      SELECT c.relname AS object_name
      FROM pg_class AS c
      INNER JOIN pg_namespace AS n
        ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND c.relkind IN ('r', 'p')
      ORDER BY c.relname
    `);

  const columnResult =
    await executor.query<{
      object_name: string;
    }>(`
      SELECT
        table_name || '.' || column_name
          AS object_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position
    `);

  const indexResult =
    await executor.query<{
      object_name: string;
    }>(`
      SELECT indexname AS object_name
      FROM pg_indexes
      WHERE schemaname = 'public'
      ORDER BY indexname
    `);

  const constraintResult =
    await executor.query<{
      object_name: string;
    }>(`
      SELECT con.conname AS object_name
      FROM pg_constraint AS con
      INNER JOIN pg_namespace AS n
        ON n.oid = con.connamespace
      WHERE n.nspname = 'public'
      ORDER BY con.conname
    `);

  const functionResult =
    await executor.query<{
      object_name: string;
    }>(`
      SELECT DISTINCT
        proc.proname AS object_name
      FROM pg_proc AS proc
      INNER JOIN pg_namespace AS n
        ON n.oid = proc.pronamespace
      WHERE n.nspname = 'public'
      ORDER BY proc.proname
    `);

  const triggerResult =
    await executor.query<{
      object_name: string;
    }>(`
      SELECT trigger.tgname AS object_name
      FROM pg_trigger AS trigger
      INNER JOIN pg_class AS target
        ON target.oid = trigger.tgrelid
      INNER JOIN pg_namespace AS n
        ON n.oid = target.relnamespace
      WHERE n.nspname = 'public'
        AND NOT trigger.tgisinternal
      ORDER BY trigger.tgname
    `);

  const pluginCountResult =
    await executor.query<{
      count: string;
    }>(`
      SELECT COUNT(*)::text AS count
      FROM core_plugins
    `);

  const corePluginCountAfter =
    Number(
      pluginCountResult.rows[0]?.count,
    );

  if (
    !Number.isInteger(corePluginCountAfter) ||
    corePluginCountAfter < 0
  ) {
    throw new Error(
      'SCHEMA_INSPECTION_PLUGIN_COUNT_INVALID',
    );
  }

  const snapshot: SchemaAcceptanceSnapshot = {
    appliedMigrations:
      stringValues(
        migrationResult.rows,
        'name',
      ),
    relations:
      stringValues(
        relationResult.rows,
        'object_name',
      ),
    columns:
      stringValues(
        columnResult.rows,
        'object_name',
      ),
    indexes:
      stringValues(
        indexResult.rows,
        'object_name',
      ),
    constraints:
      stringValues(
        constraintResult.rows,
        'object_name',
      ),
    functions:
      stringValues(
        functionResult.rows,
        'object_name',
      ),
    triggers:
      stringValues(
        triggerResult.rows,
        'object_name',
      ),
    corePluginCountBefore,
    corePluginCountAfter,
  };

  return {
    databaseQueried: true,
    databaseMutated: false,
    snapshot,
    acceptance:
      validateSchemaAcceptance(snapshot),
  };
}
