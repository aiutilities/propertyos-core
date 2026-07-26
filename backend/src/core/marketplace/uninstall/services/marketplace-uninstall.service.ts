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

@Injectable()
export class MarketplaceUninstallService {
  constructor(
    private readonly catalogue:
      MarketplaceCatalogService,
    private readonly plugins:
      PluginService,
  ) {}

  async uninstall(
    slug: string,
  ) {
    const marketplacePlugin =
      await this.catalogue.details(slug);

    if (!marketplacePlugin.pluginId) {
      throw new ConflictException(
        'MARKETPLACE_PLUGIN_NOT_INSTALLED',
      );
    }

    return this.plugins.uninstall(
      marketplacePlugin.pluginId,
    );
  }
}
