import {
  Inject,
  Injectable,
} from '@nestjs/common';
import {
  createHash,
} from 'crypto';
import {
  existsSync,
  readdirSync,
  readFileSync,
} from 'fs';
import {
  join,
} from 'path';
import {
  Pool,
  PoolClient,
} from 'pg';
import {
  POSTGRES_POOL,
} from '../../../../database/postgres';

export interface PluginMigrationRunResult {
  executed: string[];
  skipped: string[];
}

interface PluginMigration {
  name: string;
  upSql: string;
  downSql?: string;
  checksum: string;
  rollbackChecksum?: string;
}

interface AppliedMigration {
  checksum: string | null;
  reversible: boolean;
}

@Injectable()
export class PluginMigrationRunnerService {
  constructor(
    @Inject(POSTGRES_POOL)
    private readonly pool: Pool,
  ) {}

  async run(
    pluginRoot?: string,
    pluginName?: string,
    pluginVersion?: string,
  ): Promise<PluginMigrationRunResult> {
    this.assertPluginIdentity(
      pluginName,
      pluginVersion,
    );

    await this.ensureMigrationTable();

    const migrations =
      this.loadPluginMigrations(
        pluginRoot,
        pluginName,
      );

    const executed: string[] = [];
    const skipped: string[] = [];

    for (const migration of migrations) {
      const applied =
        await this.findAppliedMigration(
          migration.name,
        );

      if (applied) {
        this.assertAppliedIntegrity(
          migration,
          applied,
        );
        skipped.push(migration.name);
        continue;
      }

      if (!migration.downSql) {
        throw new Error(
          [
            'PLUGIN_MIGRATION_DOWN_REQUIRED:',
            migration.name,
            'must have a matching .down.sql file',
          ].join(' '),
        );
      }

      const client =
        await this.pool.connect();

      try {
        await client.query('BEGIN');

        await client.query(
          `
          SELECT pg_advisory_xact_lock(
            hashtext($1)
          )
          `,
          [
            `propertyos:plugin-migration:${pluginName}`,
          ],
        );

        const concurrentlyApplied =
          await this.findAppliedMigrationWithClient(
            client,
            migration.name,
          );

        if (concurrentlyApplied) {
          this.assertAppliedIntegrity(
            migration,
            concurrentlyApplied,
          );
          await client.query('COMMIT');
          skipped.push(migration.name);
          continue;
        }

        await client.query(
          migration.upSql,
        );

        await client.query(
          `
          INSERT INTO schema_migrations
          (
            name,
            checksum,
            rollback_checksum,
            migration_scope,
            plugin_name,
            plugin_version,
            reversible
          )
          VALUES (
            $1,$2,$3,'PLUGIN',$4,$5,TRUE
          )
          `,
          [
            migration.name,
            migration.checksum,
            migration.rollbackChecksum,
            pluginName,
            pluginVersion,
          ],
        );

        await client.query('COMMIT');
        executed.push(migration.name);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    }

    return {
      executed,
      skipped,
    };
  }

  async rollback(
    migrationNames: string[],
    pluginRoot?: string,
    pluginName?: string,
  ): Promise<void> {
    if (migrationNames.length === 0) {
      return;
    }

    if (!pluginRoot || !pluginName) {
      throw this.rollbackUnavailable(
        migrationNames,
      );
    }

    const migrations =
      this.loadPluginMigrations(
        pluginRoot,
        pluginName,
      );

    const byName =
      new Map(
        migrations.map(
          (migration) => [
            migration.name,
            migration,
          ],
        ),
      );

    const rollbackPlan =
      [...migrationNames]
        .reverse()
        .map((name) => {
          const migration =
            byName.get(name);

          if (!migration?.downSql) {
            throw this.rollbackUnavailable(
              migrationNames,
            );
          }

          return migration;
        });

    for (const migration of rollbackPlan) {
      const client =
        await this.pool.connect();

      try {
        await client.query('BEGIN');

        await client.query(
          `
          SELECT pg_advisory_xact_lock(
            hashtext($1)
          )
          `,
          [
            `propertyos:plugin-migration:${pluginName}`,
          ],
        );

        const applied =
          await this.findAppliedMigrationWithClient(
            client,
            migration.name,
          );

        if (!applied) {
          await client.query('COMMIT');
          continue;
        }

        this.assertAppliedIntegrity(
          migration,
          applied,
        );

        if (!applied.reversible) {
          throw this.rollbackUnavailable(
            migrationNames,
          );
        }

        await client.query(
          migration.downSql,
        );

        await client.query(
          `
          DELETE FROM schema_migrations
          WHERE name = $1
            AND checksum = $2
          `,
          [
            migration.name,
            migration.checksum,
          ],
        );

        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    }
  }

  private loadPluginMigrations(
    pluginRoot?: string,
    pluginName?: string,
  ): PluginMigration[] {
    const candidates = [
      pluginRoot
        ? join(
            pluginRoot,
            'migrations',
          )
        : undefined,
      pluginName
        ? join(
            process.cwd(),
            'src',
            'database',
            'migrations',
            'plugins',
            pluginName,
          )
        : undefined,
    ].filter(Boolean) as string[];

    const migrationDirectory =
      candidates.find(
        (candidate) =>
          existsSync(candidate),
      );

    if (!migrationDirectory) {
      return [];
    }

    const files =
      readdirSync(
        migrationDirectory,
      ).sort();

    const upFiles =
      files.filter(
        (file) =>
          file.endsWith('.up.sql'),
      );

    const legacyFiles =
      files.filter(
        (file) =>
          file.endsWith('.sql') &&
          !file.endsWith('.up.sql') &&
          !file.endsWith('.down.sql'),
      );

    return [
      ...upFiles.map((file) => {
        const base =
          file.slice(
            0,
            -'.up.sql'.length,
          );

        const downFile =
          `${base}.down.sql`;

        const upSql =
          readFileSync(
            join(
              migrationDirectory,
              file,
            ),
            'utf8',
          );

        const downSql =
          files.includes(downFile)
            ? readFileSync(
                join(
                  migrationDirectory,
                  downFile,
                ),
                'utf8',
              )
            : undefined;

        return {
          name:
            `plugins/${pluginName}/${file}`,
          upSql,
          downSql,
          checksum:
            this.checksum(upSql),
          rollbackChecksum:
            downSql
              ? this.checksum(
                  downSql,
                )
              : undefined,
        };
      }),
      ...legacyFiles.map((file) => {
        const upSql =
          readFileSync(
            join(
              migrationDirectory,
              file,
            ),
            'utf8',
          );

        return {
          name:
            `plugins/${pluginName}/${file}`,
          upSql,
          checksum:
            this.checksum(upSql),
        };
      }),
    ].sort(
      (left, right) =>
        left.name.localeCompare(
          right.name,
        ),
    );
  }

  private checksum(sql: string): string {
    return createHash('sha256')
      .update(sql)
      .digest('hex');
  }

  private assertPluginIdentity(
    pluginName?: string,
    pluginVersion?: string,
  ): void {
    if (
      !pluginName ||
      !pluginVersion
    ) {
      throw new Error(
        'Plugin name and version are required for migration execution',
      );
    }
  }

  private assertAppliedIntegrity(
    migration: PluginMigration,
    applied: AppliedMigration,
  ): void {
    if (
      applied.checksum !== null &&
      applied.checksum !==
        migration.checksum
    ) {
      throw new Error(
        `PLUGIN_MIGRATION_CHECKSUM_MISMATCH: ${migration.name}`,
      );
    }
  }

  private async findAppliedMigration(
    name: string,
  ): Promise<AppliedMigration | null> {
    const result =
      await this.pool.query<AppliedMigration>(
        `
        SELECT
          checksum,
          reversible
        FROM schema_migrations
        WHERE name = $1
        LIMIT 1
        `,
        [
          name,
        ],
      );

    return result.rows[0] ?? null;
  }

  private async findAppliedMigrationWithClient(
    client: PoolClient,
    name: string,
  ): Promise<AppliedMigration | null> {
    const result =
      await client.query<AppliedMigration>(
        `
        SELECT
          checksum,
          reversible
        FROM schema_migrations
        WHERE name = $1
        LIMIT 1
        `,
        [
          name,
        ],
      );

    return result.rows[0] ?? null;
  }

  private rollbackUnavailable(
    migrationNames: string[],
  ): Error {
    return new Error(
      [
        'PLUGIN_MIGRATION_ROLLBACK_UNAVAILABLE:',
        'executed migrations have no verified down migrations;',
        'schema migration history was preserved for manual recovery;',
        `migrations=${migrationNames.join(',')}`,
      ].join(' '),
    );
  }

  private async ensureMigrationTable(): Promise<void> {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(500) NOT NULL UNIQUE,
        executed_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
  }
}
