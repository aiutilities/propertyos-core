import {
  ConflictException,
  Injectable,
} from '@nestjs/common';

import {
  MarketplaceLifecycleMetricsService,
} from '../../services/marketplace-lifecycle-metrics.service';

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


    private readonly lifecycleMetrics:
      MarketplaceLifecycleMetricsService,  ) {}

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

    return this.lifecycleMetrics.observe(
      'uninstall',
      () =>
        this.plugins.uninstall(
          marketplacePlugin.pluginId,
        ),
    );
  }
}
