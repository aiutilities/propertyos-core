import {
  Inject,
  Injectable,
} from '@nestjs/common';
import { Pool } from 'pg';

import { POSTGRES_POOL } from '../../../database/postgres';
import { MarketplacePlugin } from '../entities/marketplace-plugin.entity';
import { MarketplaceRepository } from './marketplace.repository';

interface MarketplacePluginRow {
  id: string;
  plugin_id: string | null;
  slug: string;
  name: string;
  vendor: string;
  latest_version: string;
  description: string | null;
  category: string | null;
  icon_url: string | null;
  homepage: string | null;
  repository: string | null;
  verified: boolean;
  published_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class PostgresMarketplaceRepository
  extends MarketplaceRepository {
  constructor(
    @Inject(POSTGRES_POOL)
    private readonly pool: Pool,
  ) {
    super();
  }

  async list(): Promise<MarketplacePlugin[]> {
    const result =
      await this.pool.query<MarketplacePluginRow>(
        `
          SELECT
            id,
            plugin_id,
            slug,
            name,
            vendor,
            latest_version,
            description,
            category,
            icon_url,
            homepage,
            repository,
            verified,
            published_at,
            created_at,
            updated_at
          FROM marketplace_plugins
          ORDER BY
            verified DESC,
            published_at DESC NULLS LAST,
            name ASC
        `,
      );

    return result.rows.map(
      (row) => this.mapRow(row),
    );
  }

  async findBySlug(
    slug: string,
  ): Promise<MarketplacePlugin | null> {
    const result =
      await this.pool.query<MarketplacePluginRow>(
        `
          SELECT
            id,
            plugin_id,
            slug,
            name,
            vendor,
            latest_version,
            description,
            category,
            icon_url,
            homepage,
            repository,
            verified,
            published_at,
            created_at,
            updated_at
          FROM marketplace_plugins
          WHERE slug = $1
          LIMIT 1
        `,
        [slug],
      );

    const row = result.rows[0];

    return row
      ? this.mapRow(row)
      : null;
  }

  private mapRow(
    row: MarketplacePluginRow,
  ): MarketplacePlugin {
    return {
      id: row.id,
      pluginId: row.plugin_id,
      slug: row.slug,
      name: row.name,
      vendor: row.vendor,
      latestVersion: row.latest_version,
      description: row.description,
      category: row.category,
      iconUrl: row.icon_url,
      homepage: row.homepage,
      repository: row.repository,
      verified: row.verified,
      publishedAt: row.published_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
