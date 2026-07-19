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
  inspectDeploymentSchema,
  SchemaInspectionQueryExecutor,
} from './deployment-schema-inspector';
import {
  REQUIRED_SCHEMA_ACCEPTANCE,
} from './deployment-schema-acceptance';

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

function executor(options?: {
  relations?: string[];
  pluginCount?: string;
}): SchemaInspectionQueryExecutor {
  const query = jest.fn(
    async (text: string) => {
      if (
        text.includes(
          'FROM schema_migrations',
        )
      ) {
        return result(
          REQUIRED_SCHEMA_ACCEPTANCE
            .migrations
            .map((name) => ({ name })),
        );
      }

      if (
        text.includes(
          'information_schema.columns',
        )
      ) {
        return result(
          REQUIRED_SCHEMA_ACCEPTANCE
            .columns
            .map((object_name) => ({
              object_name,
            })),
        );
      }

      if (text.includes('FROM pg_indexes')) {
        return result(
          REQUIRED_SCHEMA_ACCEPTANCE
            .indexes
            .map((object_name) => ({
              object_name,
            })),
        );
      }

      if (
        text.includes(
          'FROM pg_constraint',
        )
      ) {
        return result(
          REQUIRED_SCHEMA_ACCEPTANCE
            .constraints
            .map((object_name) => ({
              object_name,
            })),
        );
      }

      if (text.includes('FROM pg_proc')) {
        return result(
          REQUIRED_SCHEMA_ACCEPTANCE
            .functions
            .map((object_name) => ({
              object_name,
            })),
        );
      }

      if (
        text.includes('FROM pg_trigger')
      ) {
        return result(
          REQUIRED_SCHEMA_ACCEPTANCE
            .triggers
            .map((object_name) => ({
              object_name,
            })),
        );
      }

      if (
        text.includes('FROM pg_class')
      ) {
        return result(
          (
            options?.relations ??
            [
              ...REQUIRED_SCHEMA_ACCEPTANCE
                .relations,
            ]
          ).map((object_name) => ({
            object_name,
          })),
        );
      }

      if (
        text.includes('FROM core_plugins')
      ) {
        return result([{
          count:
            options?.pluginCount ?? '1',
        }]);
      }

      throw new Error(
        `Unexpected query: ${text}`,
      );
    },
  );

  return {
    query:
      query as unknown as
        SchemaInspectionQueryExecutor['query'],
  };
}

describe('Phase 13D schema inspector', () => {
  it('collects and accepts the complete schema', async () => {
    const report =
      await inspectDeploymentSchema(
        executor(),
        1,
      );

    expect(report.databaseQueried)
      .toBe(true);
    expect(report.databaseMutated)
      .toBe(false);
    expect(report.acceptance.status)
      .toBe('ACCEPTED');
    expect(report.acceptance.errors)
      .toEqual([]);
  });

  it('rejects missing schema relations', async () => {
    const report =
      await inspectDeploymentSchema(
        executor({
          relations:
            REQUIRED_SCHEMA_ACCEPTANCE
              .relations
              .slice(1),
        }),
        1,
      );

    expect(report.acceptance.status)
      .toBe('REJECTED');
    expect(
      report.acceptance
        .missing.relations,
    ).toEqual([
      REQUIRED_SCHEMA_ACCEPTANCE
        .relations[0],
    ]);
  });

  it('rejects changed core plugin counts', async () => {
    const report =
      await inspectDeploymentSchema(
        executor({
          pluginCount: '2',
        }),
        1,
      );

    expect(report.acceptance.status)
      .toBe('REJECTED');
    expect(report.acceptance.errors)
      .toContain(
        'core_plugins row count changed during rollout',
      );
  });

  it('rejects invalid plugin-count evidence', async () => {
    await expect(
      inspectDeploymentSchema(
        executor({
          pluginCount: 'invalid',
        }),
        1,
      ),
    ).rejects.toThrow(
      'SCHEMA_INSPECTION_PLUGIN_COUNT_INVALID',
    );
  });
});
