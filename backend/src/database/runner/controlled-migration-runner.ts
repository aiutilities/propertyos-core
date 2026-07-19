import {
  ConflictException,
  Injectable,
} from '@nestjs/common';
import {
  Pool,
} from 'pg';
import {
  ControlledRolloutPlan,
} from './controlled-migration-rollout-plan';
import {
  MigrationFile,
} from './migration-loader';

export interface ControlledMigrationExecutionResult {
  status: 'APPLIED';
  targetEnvironmentId: string;
  targetDatabaseName: string;
  approvalId: string;
  evidenceSha256: string;
  appliedMigrations: string[];
  transactionStrategy:
    'ATOMIC_CONTROLLED_RANGE';
}

@Injectable()
export class ControlledMigrationRunner {
  constructor(
    private readonly pool: Pool,
  ) {}

  async execute(
    plan: ControlledRolloutPlan,
    repositoryMigrations:
      readonly MigrationFile[],
  ): Promise<ControlledMigrationExecutionResult> {
    this.assertAuthorized(plan);

    const byName = new Map(
      repositoryMigrations.map(
        (migration) => [
          migration.name,
          migration,
        ],
      ),
    );

    const migrations =
      plan.migrations.map((name) => {
        const migration = byName.get(name);

        if (!migration) {
          throw new ConflictException(
            `CONTROLLED_MIGRATION_MISSING: ${name}`,
          );
        }

        return migration;
      });

    const client =
      await this.pool.connect();

    try {
      await client.query('BEGIN');

      await client.query(`
        SELECT pg_advisory_xact_lock(
          hashtext(
            'propertyos.controlled-migration-rollout'
          )
        )
      `);

      const databaseResult =
        await client.query<{
          database_name: string;
        }>(`
          SELECT
            current_database()
              AS database_name
        `);

      const actualDatabase =
        databaseResult.rows[0]
          ?.database_name;

      if (
        actualDatabase !==
        plan.targetDatabaseName
      ) {
        throw new ConflictException(
          'CONTROLLED_MIGRATION_TARGET_MISMATCH',
        );
      }

      const appliedResult =
        await client.query<{
          name: string;
        }>(
          `
          SELECT name
          FROM schema_migrations
          WHERE name = ANY($1::text[])
          ORDER BY name
          FOR UPDATE
          `,
          [plan.migrations],
        );

      if (appliedResult.rows.length > 0) {
        throw new ConflictException(
          'CONTROLLED_MIGRATION_ALREADY_APPLIED: ' +
            appliedResult.rows
              .map((row) => row.name)
              .join(', '),
        );
      }

      for (const migration of migrations) {
        await client.query(
          migration.sql,
        );

        await client.query(
          `
          INSERT INTO schema_migrations (
            name
          )
          VALUES ($1)
          `,
          [migration.name],
        );
      }

      await client.query('COMMIT');

      return {
        status: 'APPLIED',
        targetEnvironmentId:
          plan.targetEnvironmentId,
        targetDatabaseName:
          plan.targetDatabaseName,
        approvalId:
          plan.approvalId,
        evidenceSha256:
          plan.evidenceSha256!,
        appliedMigrations:
          migrations.map(
            (migration) => migration.name,
          ),
        transactionStrategy:
          'ATOMIC_CONTROLLED_RANGE',
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  private assertAuthorized(
    plan: ControlledRolloutPlan,
  ): void {
    if (
      plan.status !== 'READY' ||
      !plan.executionAuthorized ||
      plan.productionAllowed ||
      !plan.evidenceSha256 ||
      plan.transactionStrategy !==
        'ATOMIC_CONTROLLED_RANGE'
    ) {
      throw new ConflictException(
        'CONTROLLED_MIGRATION_EXECUTION_NOT_AUTHORIZED',
      );
    }

    if (
      !plan.targetEnvironmentId.trim() ||
      !plan.targetDatabaseName.trim() ||
      !plan.approvalId.trim() ||
      !/^[a-f0-9]{40}$/.test(
        plan.gitCommit,
      )
    ) {
      throw new ConflictException(
        'CONTROLLED_MIGRATION_PLAN_INVALID',
      );
    }
  }
}
