import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { POSTGRES_POOL } from '../../../database/postgres/postgres.types';
import { ConfigurationRepository } from './configuration.repository';
import {
  ConfigurationScope,
  ConfigurationSetting,
} from '../types/configuration.types';

@Injectable()
export class PostgresConfigurationRepository
  implements ConfigurationRepository
{
  constructor(@Inject(POSTGRES_POOL) private readonly pool: Pool) {}

  async upsert(setting: ConfigurationSetting): Promise<ConfigurationSetting> {
    const result = await this.pool.query(
      `
      INSERT INTO configuration_settings (
        id, scope_type, scope_id, key, value, value_type,
        description, is_secret, created_at, updated_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      ON CONFLICT (
        scope_type,
        COALESCE(scope_id, '00000000-0000-0000-0000-000000000000'::uuid),
        key
      )
      DO UPDATE SET
        value = EXCLUDED.value,
        value_type = EXCLUDED.value_type,
        description = EXCLUDED.description,
        is_secret = EXCLUDED.is_secret,
        updated_at = NOW()
      RETURNING *
      `,
      [
        setting.id,
        setting.scopeType,
        setting.scopeId ?? null,
        setting.key,
        JSON.stringify(setting.value),
        setting.valueType,
        setting.description ?? null,
        setting.isSecret,
        setting.createdAt,
        setting.updatedAt,
      ],
    );

    return this.mapSetting(result.rows[0]);
  }

  async findById(id: string): Promise<ConfigurationSetting | null> {
    const result = await this.pool.query(
      `SELECT * FROM configuration_settings WHERE id = $1`,
      [id],
    );

    return result.rows[0] ? this.mapSetting(result.rows[0]) : null;
  }

  async findByScopeAndKey(
    scopeType: ConfigurationScope,
    scopeId: string | undefined,
    key: string,
  ): Promise<ConfigurationSetting | null> {
    const result = await this.pool.query(
      `
      SELECT *
      FROM configuration_settings
      WHERE scope_type = $1
        AND (
          ($2::uuid IS NULL AND scope_id IS NULL)
          OR scope_id = $2::uuid
        )
        AND key = $3
      LIMIT 1
      `,
      [scopeType, scopeId ?? null, key],
    );

    return result.rows[0] ? this.mapSetting(result.rows[0]) : null;
  }

  async list(
    scopeType?: ConfigurationScope,
    scopeId?: string,
  ): Promise<ConfigurationSetting[]> {
    if (!scopeType) {
      const result = await this.pool.query(
        `SELECT * FROM configuration_settings ORDER BY scope_type, key`,
      );

      return result.rows.map((row) => this.mapSetting(row));
    }

    const result = await this.pool.query(
      `
      SELECT *
      FROM configuration_settings
      WHERE scope_type = $1
        AND (
          ($2::uuid IS NULL AND scope_id IS NULL)
          OR scope_id = $2::uuid
        )
      ORDER BY key
      `,
      [scopeType, scopeId ?? null],
    );

    return result.rows.map((row) => this.mapSetting(row));
  }

  async delete(id: string): Promise<void> {
    await this.pool.query(
      `DELETE FROM configuration_settings WHERE id = $1`,
      [id],
    );
  }

  private mapSetting(row: any): ConfigurationSetting {
    return {
      id: row.id,
      scopeType: row.scope_type,
      scopeId: row.scope_id ?? undefined,
      key: row.key,
      value: row.value,
      valueType: row.value_type,
      description: row.description ?? undefined,
      isSecret: row.is_secret,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
