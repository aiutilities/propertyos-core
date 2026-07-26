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
  MarketplacePublisherProfile,
  MarketplacePublisherStatus,
} from '../entities/marketplace-publisher.entity';
import {
  MarketplacePlugin,
} from '../entities/marketplace-plugin.entity';
import {
  MarketplacePublisherRepository,
} from './marketplace-publisher.repository';

interface MarketplacePublisherRow {
  publisher_id: string;
  display_name: string;
  status: MarketplacePublisherStatus;
  metadata: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
  verified: boolean;
  plugin_count: string;
  latest_release: Date | null;
  public_key_fingerprint: string | null;
}

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
export class PostgresMarketplacePublisherRepository
  extends MarketplacePublisherRepository {
  constructor(
    @Inject(POSTGRES_POOL)
    private readonly pool: Pool,
  ) {
    super();
  }

  async listPublishers():
    Promise<MarketplacePublisherProfile[]> {
    const result =
      await this.pool.query<MarketplacePublisherRow>(
        `
          SELECT
            publisher.id AS publisher_id,
            publisher.display_name,
            publisher.status,
            publisher.metadata,
            publisher.created_at,
            publisher.updated_at,
            EXISTS (
              SELECT 1
              FROM plugin_publisher_keys
                AS active_key
              WHERE
                active_key.publisher_id =
                  publisher.id
                AND active_key.status = 'ACTIVE'
                AND active_key.revoked_at IS NULL
                AND active_key.valid_from <= NOW()
                AND (
                  active_key.valid_until IS NULL
                  OR active_key.valid_until > NOW()
                )
            ) AS verified,
            COUNT(
              DISTINCT marketplace_plugin.id
            )::text AS plugin_count,
            MAX(
              approved_publication.submitted_at
            ) AS latest_release,
            (
              SELECT signing_key.fingerprint_sha256
              FROM plugin_publisher_keys
                AS signing_key
              WHERE
                signing_key.publisher_id =
                  publisher.id
                AND signing_key.status = 'ACTIVE'
                AND signing_key.revoked_at IS NULL
                AND signing_key.valid_from <= NOW()
                AND (
                  signing_key.valid_until IS NULL
                  OR signing_key.valid_until > NOW()
                )
              ORDER BY signing_key.valid_from DESC
              LIMIT 1
            ) AS public_key_fingerprint
          FROM plugin_publishers
            AS publisher
          LEFT JOIN marketplace_plugins
            AS marketplace_plugin
            ON marketplace_plugin.publisher_id =
              publisher.id
          LEFT JOIN plugin_publications
            AS approved_publication
            ON approved_publication.publisher_id =
              publisher.id
            AND approved_publication.status =
              'APPROVED'
          GROUP BY
            publisher.id,
            publisher.display_name,
            publisher.status,
            publisher.metadata,
            publisher.created_at,
            publisher.updated_at
          ORDER BY
            verified DESC,
            publisher.display_name ASC,
            publisher.id ASC
        `,
      );

    return result.rows.map(
      (row) => this.mapPublisher(row),
    );
  }

  async findPublisher(
    publisherId: string,
  ): Promise<MarketplacePublisherProfile | null> {
    const result =
      await this.pool.query<MarketplacePublisherRow>(
        `
          SELECT
            publisher.id AS publisher_id,
            publisher.display_name,
            publisher.status,
            publisher.metadata,
            publisher.created_at,
            publisher.updated_at,
            EXISTS (
              SELECT 1
              FROM plugin_publisher_keys
                AS active_key
              WHERE
                active_key.publisher_id =
                  publisher.id
                AND active_key.status = 'ACTIVE'
                AND active_key.revoked_at IS NULL
                AND active_key.valid_from <= NOW()
                AND (
                  active_key.valid_until IS NULL
                  OR active_key.valid_until > NOW()
                )
            ) AS verified,
            COUNT(
              DISTINCT marketplace_plugin.id
            )::text AS plugin_count,
            MAX(
              approved_publication.submitted_at
            ) AS latest_release,
            (
              SELECT signing_key.fingerprint_sha256
              FROM plugin_publisher_keys
                AS signing_key
              WHERE
                signing_key.publisher_id =
                  publisher.id
                AND signing_key.status = 'ACTIVE'
                AND signing_key.revoked_at IS NULL
                AND signing_key.valid_from <= NOW()
                AND (
                  signing_key.valid_until IS NULL
                  OR signing_key.valid_until > NOW()
                )
              ORDER BY signing_key.valid_from DESC
              LIMIT 1
            ) AS public_key_fingerprint
          FROM plugin_publishers
            AS publisher
          LEFT JOIN marketplace_plugins
            AS marketplace_plugin
            ON marketplace_plugin.publisher_id =
              publisher.id
          LEFT JOIN plugin_publications
            AS approved_publication
            ON approved_publication.publisher_id =
              publisher.id
            AND approved_publication.status =
              'APPROVED'
          WHERE publisher.id = $1
          GROUP BY
            publisher.id,
            publisher.display_name,
            publisher.status,
            publisher.metadata,
            publisher.created_at,
            publisher.updated_at
          LIMIT 1
        `,
        [publisherId],
      );

    const row = result.rows[0];

    return row
      ? this.mapPublisher(row)
      : null;
  }

  async listPublisherPlugins(
    publisherId: string,
  ): Promise<MarketplacePlugin[]> {
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
          WHERE publisher_id = $1
          ORDER BY
            verified DESC,
            published_at DESC NULLS LAST,
            name ASC,
            id ASC
        `,
        [publisherId],
      );

    return result.rows.map(
      (row) => this.mapPlugin(row),
    );
  }

  private mapPublisher(
    row: MarketplacePublisherRow,
  ): MarketplacePublisherProfile {
    const metadata =
      row.metadata ?? {};

    return {
      publisherId: row.publisher_id,
      displayName: row.display_name,
      status: row.status,
      verified: row.verified,
      pluginCount: Number(row.plugin_count),
      latestRelease: row.latest_release,
      description:
        this.readMetadataString(
          metadata,
          'description',
        ),
      homepage:
        this.readMetadataString(
          metadata,
          'homepage',
        ),
      logoUrl:
        this.readMetadataString(
          metadata,
          'logoUrl',
        ),
      joinedAt: row.created_at,
      updatedAt: row.updated_at,
      publicKeyFingerprint:
        row.public_key_fingerprint,
    };
  }

  private mapPlugin(
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

  private readMetadataString(
    metadata: Record<string, unknown>,
    key: string,
  ): string | null {
    const value = metadata[key];

    return typeof value === 'string'
      && value.trim().length > 0
      ? value.trim()
      : null;
  }
}
