import {
  MarketplacePluginVersion,
} from '../entities/marketplace-plugin-version.entity';

export abstract class MarketplaceVersionRepository {
  abstract list(
    pluginSlug: string,
  ): Promise<MarketplacePluginVersion[] | null>;

  abstract get(
    pluginSlug: string,
    version: string,
  ): Promise<MarketplacePluginVersion | null>;
}
