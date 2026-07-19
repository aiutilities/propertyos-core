import {
  Injectable,
} from '@nestjs/common';
import semver from 'semver';
import {
  PluginPublicationGovernanceService,
} from '../../publication/plugin-publication-governance.service';
import {
  PluginPublication,
} from '../../publication/plugin-publication-governance.types';
import {
  SearchMarketplaceDto,
} from '../dto/search-marketplace.dto';
import {
  MarketplacePlugin,
  MarketplacePluginVersion,
  MarketplaceSearchResult,
} from '../types/plugin-marketplace.types';

@Injectable()
export class PluginMarketplaceService {
  constructor(
    private readonly governance:
      PluginPublicationGovernanceService,
  ) {}

  async list():
    Promise<MarketplacePlugin[]> {
    const publications =
      await this.governance.listApproved();

    const grouped =
      new Map<
        string,
        PluginPublication[]
      >();

    for (
      const publication of
      publications
    ) {
      const current =
        grouped.get(
          publication.pluginId,
        ) ?? [];

      current.push(
        publication,
      );
      grouped.set(
        publication.pluginId,
        current,
      );
    }

    return [
      ...grouped.entries(),
    ]
      .map(
        (
          [
            pluginId,
            versions,
          ],
        ) =>
          this.toMarketplacePlugin(
            pluginId,
            versions,
          ),
      )
      .sort(
        (
          left,
          right,
        ) =>
          this.compareText(
            left.id,
            right.id,
          ),
      );
  }

  async get(
    id: string,
  ): Promise<
    MarketplacePlugin | undefined
  > {
    const plugins =
      await this.list();

    return plugins.find(
      (plugin) =>
        plugin.id === id,
    );
  }

  async search(
    dto: SearchMarketplaceDto,
  ): Promise<
    MarketplaceSearchResult
  > {
    const query =
      dto.query
        ?.trim()
        .toLowerCase();
    const category =
      dto.category
        ?.trim()
        .toLowerCase();
    const tag =
      dto.tag
        ?.trim()
        .toLowerCase();

    const items =
      (
        await this.list()
      ).filter(
        (plugin) => {
          const matchesQuery =
            !query ||
            plugin.name
              .toLowerCase()
              .includes(query) ||
            plugin.provider
              .toLowerCase()
              .includes(query) ||
            plugin.description
              ?.toLowerCase()
              .includes(query);

          const matchesCategory =
            !category ||
            plugin.category
              ?.toLowerCase() ===
              category;

          const matchesTag =
            !tag ||
            plugin.tags
              .map(
                (item) =>
                  item.toLowerCase(),
              )
              .includes(tag);

          return (
            matchesQuery &&
            matchesCategory &&
            matchesTag
          );
        },
      );

    return {
      total:
        items.length,
      items,
    };
  }

  private toMarketplacePlugin(
    pluginId: string,
    publications:
      PluginPublication[],
  ): MarketplacePlugin {
    const sorted =
      [...publications].sort(
        (
          left,
          right,
        ) =>
          semver.rcompare(
            left.version,
            right.version,
          ),
      );
    const latest =
      sorted[0];
    const metadata =
      latest.metadata ?? {};

    return {
      id:
        pluginId,
      name:
        latest.pluginName,
      provider:
        latest.publisherId,
      description:
        this.optionalString(
          metadata.description,
        ),
      category:
        this.optionalString(
          metadata.category,
        ),
      tags:
        this.stringArray(
          metadata.tags,
        ),
      latestVersion:
        latest.version,
      status:
        'AVAILABLE',
      verified:
        true,
      downloads:
        0,
      versions:
        sorted.map(
          (publication) =>
            this.toVersion(
              publication,
            ),
        ),
    };
  }

  private toVersion(
    publication:
      PluginPublication,
  ): MarketplacePluginVersion {
    return {
      publicationId:
        publication.id,
      version:
        publication.version,
      releasedAt:
        publication.reviewedAt ??
        publication.updatedAt,
      minimumPlatformVersion:
        this.optionalString(
          publication.metadata
            .minimumPlatformVersion,
        ) ?? '0.1.0',
      checksum:
        publication.artifactSha256,
      integrityChecksum:
        publication.integritySha256,
      publisherKeyId:
        publication.keyId,
      artifactStorageObjectId:
        publication
          .artifactStorageObjectId,
      changelog:
        this.optionalString(
          publication.metadata
            .changelog,
        ),
    };
  }

  private optionalString(
    value: unknown,
  ): string | undefined {
    return (
      typeof value === 'string' &&
      value.trim()
    )
      ? value.trim()
      : undefined;
  }

  private stringArray(
    value: unknown,
  ): string[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value.filter(
      (item):
        item is string =>
          typeof item ===
            'string' &&
          item.trim().length > 0,
    ).map(
      (item) =>
        item.trim(),
    );
  }

  private compareText(
    left: string,
    right: string,
  ): number {
    if (left < right) {
      return -1;
    }

    if (left > right) {
      return 1;
    }

    return 0;
  }
}
