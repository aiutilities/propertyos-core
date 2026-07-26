import {
  ConflictException,
  Injectable,
} from '@nestjs/common';

import {
  PluginService,
} from '../../../plugin/services/plugin.service';
import {
  MarketplaceCatalogService,
} from '../../services/marketplace-catalog.service';
import {
  MarketplaceVersionService,
} from '../../version/services/marketplace-version.service';

@Injectable()
export class MarketplaceUpgradeService {
  constructor(
    private readonly catalogue:
      MarketplaceCatalogService,
    private readonly versions:
      MarketplaceVersionService,
    private readonly plugins:
      PluginService,
  ) {}

  async upgrade(
    slug: string,
    version: string,
    notes?: string,
  ) {
    const marketplacePlugin =
      await this.catalogue.details(slug);

    if (!marketplacePlugin.pluginId) {
      throw new ConflictException(
        'MARKETPLACE_PLUGIN_NOT_INSTALLED',
      );
    }

    const approvedVersion =
      await this.versions.details(
        slug,
        version,
      );

    return this.plugins.upgrade(
      marketplacePlugin.pluginId,
      {
        version:
          approvedVersion.version,
        notes:
          notes ??
          `Marketplace upgrade to ${approvedVersion.version}`,
      },
    );
  }
}
