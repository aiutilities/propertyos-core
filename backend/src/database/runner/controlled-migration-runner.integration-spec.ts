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
  buildControlledRolloutPlan,
  ControlledRolloutRequest,
} from './controlled-migration-rollout-plan';
import {
  ControlledMigrationRunner,
} from './controlled-migration-runner';
import {
  BackupEvidenceValidation,
} from './deployment-backup-evidence';
import {
  MigrationFile,
} from './migration-loader';
import {
  CONTROLLED_DEPLOYMENT_MIGRATIONS,
} from './migration-readiness';

function request():
  ControlledRolloutRequest {
  const backup:
    BackupEvidenceValidation = {
      status: 'VALID',
      applyAuthorized: false,
      errors: [],
    };

  return {
    environmentClass: 'ISOLATED',
    sourceEnvironmentId:
      'propertyos-development',
    targetEnvironmentId:
      'propertyos-restore-exercise',
    sourceDatabaseName:
      'propertyos',
    targetDatabaseName:
      'propertyos_restore_exercise',
    gitCommit:
      'aba66a371563e6da3ebb6298db4de39fa8a7393f',
    operatorId:
      'migration-operator',
    approverId:
      'migration-approver',
    approvalId:
      'migration-approval-001',
    approvedAt:
      '2026-07-19T17:00:00.000Z',
    expectedPendingMigrations:
      CONTROLLED_DEPLOYMENT_MIGRATIONS.map(
        (migration) => migration.name,
      ),
    technicalPreflightStatus: 'READY',
    backupEvidenceValidation: backup,
    explicitApplyApproval: true,
  };
}

function migrations(): MigrationFile[] {
  return CONTROLLED_DEPLOYMENT_MIGRATIONS.map(
    (migration, index) => ({
      name: migration.name,
      path: `/migrations/${migration.name}`,
      sql:
        `SELECT ${index + 1} ` +
        `AS migration_${index + 1}`,
    }),
  );
}

function harness(options?: {
  databaseName?: string;
  appliedNames?: string[];
  failSql?: string;
}) {
  const calls: Array<{
    text: string;
    values?: unknown[];
  }> = [];

  const client = {
    query: jest.fn(
      async (
        text: string,
        values?: unknown[],
      ) => {
        calls.push({ text, values });

        if (
          text.includes(
            'current_database()',
          )
        ) {
          return {
            rows: [{
              database_name:
                options?.databaseName ??
                'propertyos_restore_exercise',
            }],
          };
        }

        if (
          text.includes(
            'FROM schema_migrations',
          )
        ) {
          return {
            rows:
              (
                options?.appliedNames ??
                []
              ).map((name) => ({ name })),
          };
        }

        if (
          options?.failSql &&
          text.includes(options.failSql)
        ) {
          throw new Error(
            'simulated migration failure',
          );
        }

        return { rows: [] };
      },
    ),
    release: jest.fn(),
  };

  const pool = {
    connect:
      jest.fn(async () => client),
  };

  return {
    runner:
      new ControlledMigrationRunner(
        pool as unknown as Pool,
      ),
    pool,
    client,
    calls,
  };
}

function normalizedTexts(
  calls: Array<{ text: string }>,
): string[] {
  return calls.map(
    (call) =>
      call.text.replace(/\s+/g, ' ').trim(),
  );
}

describe('Phase 13D controlled migration runner', () => {
  it('applies the exact range atomically in order', async () => {
    const plan =
      buildControlledRolloutPlan(
        request(),
      );
    const files = migrations();
    const test = harness();

    const result =
      await test.runner.execute(
        plan,
        files,
      );

    expect(result.status).toBe('APPLIED');
    expect(result.appliedMigrations)
      .toEqual(plan.migrations);
    expect(result.transactionStrategy)
      .toBe('ATOMIC_CONTROLLED_RANGE');

    const texts =
      normalizedTexts(test.calls);

    expect(texts[0]).toBe('BEGIN');
    expect(
      texts[1],
    ).toContain(
      'pg_advisory_xact_lock',
    );
    expect(
      texts[texts.length - 1],
    ).toBe('COMMIT');
    expect(texts).not.toContain('ROLLBACK');

    for (
      let index = 0;
      index < files.length;
      index += 1
    ) {
      const sqlPosition =
        texts.indexOf(
          files[index].sql,
        );
      const recordPosition =
        test.calls.findIndex(
          (call) =>
            call.values?.[0] ===
            files[index].name,
        );

      expect(sqlPosition)
        .toBeGreaterThan(-1);
      expect(recordPosition)
        .toBeGreaterThan(sqlPosition);
    }

    expect(test.client.release)
      .toHaveBeenCalledTimes(1);
  });

  it('rejects unauthorized plans before connecting', async () => {
    const rolloutRequest =
      request();
    rolloutRequest.explicitApplyApproval =
      false;

    const plan =
      buildControlledRolloutPlan(
        rolloutRequest,
      );
    const test = harness();

    await expect(
      test.runner.execute(
        plan,
        migrations(),
      ),
    ).rejects.toThrow(
      'CONTROLLED_MIGRATION_EXECUTION_NOT_AUTHORIZED',
    );

    expect(test.pool.connect)
      .not.toHaveBeenCalled();
  });

  it('rejects a missing migration before connecting', async () => {
    const plan =
      buildControlledRolloutPlan(
        request(),
      );
    const files = migrations().slice(1);
    const test = harness();

    await expect(
      test.runner.execute(
        plan,
        files,
      ),
    ).rejects.toThrow(
      'CONTROLLED_MIGRATION_MISSING',
    );

    expect(test.pool.connect)
      .not.toHaveBeenCalled();
  });

  it('rolls back on target database mismatch', async () => {
    const plan =
      buildControlledRolloutPlan(
        request(),
      );
    const test = harness({
      databaseName: 'propertyos',
    });

    await expect(
      test.runner.execute(
        plan,
        migrations(),
      ),
    ).rejects.toThrow(
      'CONTROLLED_MIGRATION_TARGET_MISMATCH',
    );

    const texts =
      normalizedTexts(test.calls);

    expect(texts).toContain('ROLLBACK');
    expect(texts).not.toContain('COMMIT');
  });

  it('rolls back when a controlled migration is already applied', async () => {
    const plan =
      buildControlledRolloutPlan(
        request(),
      );
    const test = harness({
      appliedNames: [
        plan.migrations[0],
      ],
    });

    await expect(
      test.runner.execute(
        plan,
        migrations(),
      ),
    ).rejects.toThrow(
      'CONTROLLED_MIGRATION_ALREADY_APPLIED',
    );

    const texts =
      normalizedTexts(test.calls);

    expect(texts).toContain('ROLLBACK');
    expect(texts).not.toContain(
      migrations()[0].sql,
    );
  });

  it('rolls back the complete range on migration failure', async () => {
    const plan =
      buildControlledRolloutPlan(
        request(),
      );
    const files = migrations();
    const test = harness({
      failSql: 'migration_4',
    });

    await expect(
      test.runner.execute(
        plan,
        files,
      ),
    ).rejects.toThrow(
      'simulated migration failure',
    );

    const texts =
      normalizedTexts(test.calls);

    expect(texts).toContain('ROLLBACK');
    expect(texts).not.toContain('COMMIT');
    expect(test.client.release)
      .toHaveBeenCalledTimes(1);
  });
});
