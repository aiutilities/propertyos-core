import {
  Inject,
  Injectable,
} from '@nestjs/common';
import {
  Pool,
} from 'pg';

import {
  POSTGRES_POOL,
} from '../../../database/postgres';
import {
  MarketplaceSearchQuery,
  MarketplaceSortField,
} from '../dto/marketplace-query.dto';
import {
  MarketplacePlugin,
} from '../entities/marketplace-plugin.entity';
import {
  MarketplaceRepository,
  MarketplaceSearchResult,
} from './marketplace.repository';

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

const marketplaceSortColumns:
  Record<MarketplaceSortField, string> = {
    name: 'name',
    vendor: 'vendor',
    publishedAt: 'published_at',
    updatedAt: 'updated_at',
  };

@Injectable()
export class PostgresMarketplaceRepository
  extends MarketplaceRepository {
  constructor(
    @Inject(POSTGRES_POOL)
    private readonly pool: Pool,
  ) {
    super();
  }

  async search(
    query: MarketplaceSearchQuery,
  ): Promise<MarketplaceSearchResult> {
    const values: unknown[] = [];
    const conditions: string[] = [];

    const addValue = (
      value: unknown,
    ): string => {
      values.push(value);

      return `$${values.length}`;
    };

    if (query.q) {
      const parameter =
        addValue(`%${query.q}%`);

      conditions.push(
        `(
          name ILIKE ${parameter}
          OR slug ILIKE ${parameter}
          OR vendor ILIKE ${parameter}
          OR COALESCE(description, '')
            ILIKE ${parameter}
        )`,
      );
    }

    if (query.category) {
      const parameter =
        addValue(query.category);

      conditions.push(
        `LOWER(category) =
          LOWER(${parameter})`,
      );
    }

    if (query.vendor) {
      const parameter =
        addValue(query.vendor);

      conditions.push(
        `LOWER(vendor) =
          LOWER(${parameter})`,
      );
    }

    if (query.verified !== undefined) {
      const parameter =
        addValue(query.verified);

      conditions.push(
        `verified = ${parameter}`,
      );
    }

    const where =
      conditions.length > 0
        ? `WHERE ${conditions.join(' AND ')}`
        : '';

    const countResult =
      await this.pool.query<{
        total: string;
      }>(
        `
          SELECT COUNT(*)::text AS total
          FROM marketplace_plugins
          ${where}
        `,
        values,
      );

    const limitParameter =
      addValue(query.limit);

    const offsetParameter =
      addValue(query.offset);

    const sortColumn =
      marketplaceSortColumns[query.sort];

    const sortDirection =
      query.direction === 'asc'
        ? 'ASC'
        : 'DESC';

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
          ${where}
          ORDER BY
            ${sortColumn}
              ${sortDirection}
              NULLS LAST,
            name ASC,
            id ASC
          LIMIT ${limitParameter}
          OFFSET ${offsetParameter}
        `,
        values,
      );

    return {
      items: result.rows.map(
        (row) => this.mapRow(row),
      ),
      total: Number(
        countResult.rows[0]?.total ?? 0,
      ),
    };
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
      latestVersion:
        row.latest_version,
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
