import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';

import { POSTGRES_POOL } from '../../../database/postgres';
import { BasePostgresRepository } from '../../platform';
import { PluginEntity } from '../entities/plugin.entity';
import { PluginRepository } from './plugin-repository.interface';

@Injectable()
export class PostgresPluginRepository
  extends BasePostgresRepository
  implements PluginRepository
{
  constructor(
    @Inject(POSTGRES_POOL)
    private readonly pool: Pool,
  ) {
    super();
  }

  async create(plugin: Partial<PluginEntity>): Promise<PluginEntity> {
    const result = await this.pool.query(
      `
      INSERT INTO core_plugins
      (
        name,
        display_name,
        version,
        description,
        author,
        manifest,
        status
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING *
      `,
      [
        plugin.name,
        plugin.displayName,
        plugin.version,
        plugin.description ?? null,
        plugin.author ?? null,
        JSON.stringify(plugin.manifest ?? {}),
        plugin.status,
      ],
    );

    return this.map(result.rows[0]);
  }

  async findAll(): Promise<PluginEntity[]> {
    const result = await this.pool.query(`
      SELECT *
      FROM core_plugins
      ORDER BY display_name
    `);

    return result.rows.map((r) => this.map(r));
  }

  async findById(id: string): Promise<PluginEntity | null> {
    const result = await this.pool.query(
      `SELECT * FROM core_plugins WHERE id=$1 LIMIT 1`,
      [id],
    );

    return result.rows[0] ? this.map(result.rows[0]) : null;
  }

  async findByName(name: string): Promise<PluginEntity | null> {
    const result = await this.pool.query(
      `SELECT * FROM core_plugins WHERE name=$1 LIMIT 1`,
      [name],
    );

    return result.rows[0] ? this.map(result.rows[0]) : null;
  }


  async findDependents(pluginName: string): Promise<PluginEntity[]> {
    const result = await this.pool.query(
      `
      SELECT *
      FROM core_plugins
      WHERE manifest::text LIKE $1
        AND name <> $2
      ORDER BY display_name
      `,
      [`%"dependencies":["${pluginName}%`, pluginName],
    );

    return result.rows.map((row) => this.map(row));
  }

  async update(
    id: string,
    plugin: Partial<PluginEntity>,
  ): Promise<PluginEntity> {
    const result = await this.pool.query(
      `
      UPDATE core_plugins
      SET
        version=COALESCE($2,version),
        manifest=COALESCE($3,manifest),
        status=COALESCE($4,status),
        activated_at=COALESCE($5,activated_at),
        deactivated_at=COALESCE($6,deactivated_at),
        updated_at=NOW()
      WHERE id=$1
      RETURNING *
      `,
      [
        id,
        plugin.version ?? null,
        plugin.manifest ? JSON.stringify(plugin.manifest) : null,
        plugin.status ?? null,
        plugin.activatedAt ?? null,
        plugin.deactivatedAt ?? null,
      ],
    );

    return this.map(result.rows[0]);
  }

  async delete(id: string): Promise<void> {
    await this.pool.query(
      `DELETE FROM core_plugins WHERE id=$1`,
      [id],
    );
  }

  async remove(id: string): Promise<void> {
    await this.delete(id);
  }

  private map(row: any): PluginEntity {
    return {
      id: row.id,
      name: row.name,
      displayName: row.display_name,
      version: row.version,
      description: row.description,
      author: row.author,
      manifest: row.manifest,
      status: row.status,
      installedAt: row.installed_at,
      activatedAt: row.activated_at,
      deactivatedAt: row.deactivated_at,
    };
  }
}
