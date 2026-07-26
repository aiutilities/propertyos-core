import {
  Inject,
  Injectable,
} from '@nestjs/common';
import {
  Pool,
} from 'pg';

import {
  POSTGRES_POOL,
} from '../../../../database/postgres';
import {
  MarketplacePluginVersion,
} from '../entities/marketplace-plugin-version.entity';
import {
  MarketplaceVersionRepository,
} from './marketplace-version.repository';

interface MarketplaceVersionRow {
  publication_id: string;
  plugin_id: string;
  plugin_name: string;
  publisher_id: string;
  publisher_key_id: string;
  version: string;
  released_at: Date;
  reviewed_at: Date | null;
  artifact_storage_object_id: string;
  artifact_sha256: string;
  integrity_sha256: string;
  minimum_platform_version: string | null;
  dependencies: unknown;
  changelog: string | null;
  latest: boolean;
}

@Injectable()
export class PostgresMarketplaceVersionRepository
  extends MarketplaceVersionRepository {
  constructor(
    @Inject(POSTGRES_POOL)
    private readonly pool: Pool,
  ) {
    super();
  }

  async list(
    pluginSlug: string,
  ): Promise<MarketplacePluginVersion[] | null> {
    const catalogue =
      await this.pool.query<{
        slug: string;
        publisher_id: string | null;
      }>(
        `
          SELECT
            slug,
            publisher_id
          FROM marketplace_plugins
          WHERE slug = $1
          LIMIT 1
        `,
        [pluginSlug],
      );

    const marketplacePlugin =
      catalogue.rows[0];

    if (!marketplacePlugin) {
      return null;
    }

    const result =
      await this.pool.query<MarketplaceVersionRow>(
        `
          WITH approved_versions AS
          (
            SELECT
              publication.id
                AS publication_id,
              publication.plugin_id,
              publication.plugin_name,
              publication.publisher_id,
              publication.key_id
                AS publisher_key_id,
              publication.version,
              COALESCE(
                publication.reviewed_at,
                publication.submitted_at
              ) AS released_at,
              publication.reviewed_at,
              publication.artifact_storage_object_id,
              publication.artifact_sha256,
              publication.integrity_sha256,
              NULLIF(
                publication.metadata
                  ->> 'minimumPlatformVersion',
                ''
              ) AS minimum_platform_version,
              COALESCE(
                publication.metadata
                  -> 'dependencies',
                '[]'::jsonb
              ) AS dependencies,
              NULLIF(
                publication.metadata
                  ->> 'changelog',
                ''
              ) AS changelog,
              ROW_NUMBER() OVER
              (
                ORDER BY
                  COALESCE(
                    publication.reviewed_at,
                    publication.submitted_at
                  ) DESC,
                  publication.version DESC,
                  publication.id DESC
              ) = 1 AS latest
            FROM plugin_publications
              AS publication
            WHERE
              publication.status = 'APPROVED'
              AND publication.plugin_id = $1
              AND
              (
                $2::varchar IS NULL
                OR publication.publisher_id = $2
              )
          )
          SELECT
            publication_id,
            plugin_id,
            plugin_name,
            publisher_id,
            publisher_key_id,
            version,
            released_at,
            reviewed_at,
            artifact_storage_object_id,
            artifact_sha256,
            integrity_sha256,
            minimum_platform_version,
            dependencies,
            changelog,
            latest
          FROM approved_versions
          ORDER BY
            released_at DESC,
            version DESC,
            publication_id DESC
        `,
        [
          marketplacePlugin.slug,
          marketplacePlugin.publisher_id,
        ],
      );

    return result.rows.map(
      (row) => this.mapRow(row),
    );
  }

  async get(
    pluginSlug: string,
    version: string,
  ): Promise<MarketplacePluginVersion | null> {
    const versions =
      await this.list(pluginSlug);

    if (!versions) {
      return null;
    }

    return versions.find(
      (item) => item.version === version,
    ) ?? null;
  }

  private mapRow(
    row: MarketplaceVersionRow,
  ): MarketplacePluginVersion {
    return {
      publicationId:
        row.publication_id,
      pluginId:
        row.plugin_id,
      pluginName:
        row.plugin_name,
      publisherId:
        row.publisher_id,
      publisherKeyId:
        row.publisher_key_id,
      version:
        row.version,
      releasedAt:
        row.released_at,
      reviewedAt:
        row.reviewed_at,
      artifactStorageObjectId:
        row.artifact_storage_object_id,
      artifactSha256:
        row.artifact_sha256,
      integritySha256:
        row.integrity_sha256,
      minimumPlatformVersion:
        row.minimum_platform_version,
      dependencies:
        Array.isArray(row.dependencies)
          ? row.dependencies.filter(
              (item): item is string =>
                typeof item === 'string',
            )
          : [],
      changelog:
        row.changelog,
      verified: true,
      latest:
        row.latest,
    };
  }
}
