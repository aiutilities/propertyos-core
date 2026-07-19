import { Inject, Injectable } from '@nestjs/common';
import { existsSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { Pool } from 'pg';
import { POSTGRES_POOL } from '../../../../database/postgres';

export interface PluginMigrationRunResult {
  executed: string[];
  skipped: string[];
}

@Injectable()
export class PluginMigrationRunnerService {
  constructor(
    @Inject(POSTGRES_POOL)
    private readonly pool: Pool,
  ) {}

  async run(pluginRoot?: string, pluginName?: string): Promise<PluginMigrationRunResult> {
    await this.ensureMigrationTable();

    const migrations = this.loadPluginMigrations(pluginRoot, pluginName);
    const executed: string[] = [];
    const skipped: string[] = [];

    for (const migration of migrations) {
      const alreadyRun = await this.hasMigrationRun(migration.name);

      if (alreadyRun) {
        skipped.push(migration.name);
        continue;
      }

      const client = await this.pool.connect();

      try {
        await client.query('BEGIN');
        await client.query(migration.sql);
        await client.query(
          'INSERT INTO schema_migrations (name) VALUES ($1)',
          [migration.name],
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

    return { executed, skipped };
  }

  async rollback(migrationNames: string[]): Promise<void> {
    if (migrationNames.length === 0) {
      return;
    }

    throw new Error(
      [
        'PLUGIN_MIGRATION_ROLLBACK_UNAVAILABLE:',
        'executed migrations have no verified down migrations;',
        'schema migration history was preserved for manual recovery;',
        `migrations=${migrationNames.join(',')}`,
      ].join(' '),
    );
  }

  private loadPluginMigrations(pluginRoot?: string, pluginName?: string) {
    const candidates = [
      pluginRoot ? join(pluginRoot, 'migrations') : undefined,
      pluginName
        ? join(process.cwd(), 'src', 'database', 'migrations', 'plugins', pluginName)
        : undefined,
    ].filter(Boolean) as string[];

    const migrationDir = candidates.find((candidate) => existsSync(candidate));

    if (!migrationDir) {
      return [];
    }

    return readdirSync(migrationDir)
      .filter((file) => file.endsWith('.sql'))
      .sort()
      .map((file) => {
        const filePath = join(migrationDir, file);

        return {
          name: `plugins/${pluginName ?? 'unknown'}/${file}`,
          path: filePath,
          sql: readFileSync(filePath, 'utf8'),
        };
      });
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

  private async hasMigrationRun(name: string): Promise<boolean> {
    const result = await this.pool.query(
      'SELECT 1 FROM schema_migrations WHERE name = $1 LIMIT 1',
      [name],
    );

    return (result.rowCount ?? 0) > 0;
  }
}
