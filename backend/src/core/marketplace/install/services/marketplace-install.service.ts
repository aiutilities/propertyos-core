import {
  Injectable,
} from '@nestjs/common';

import {
  MarketplaceLifecycleMetricsService,
} from '../../services/marketplace-lifecycle-metrics.service';

import { MarketplaceVersionService } from '../../version/services/marketplace-version.service';
import { PluginPublicationInstallationService } from '../../../plugin/publication/plugin-publication-installation.service';

@Injectable()
export class MarketplaceInstallService {

  constructor(
    private readonly versions: MarketplaceVersionService,
    private readonly installer: PluginPublicationInstallationService,


    private readonly lifecycleMetrics:
      MarketplaceLifecycleMetricsService,  ) {}

  async install(
    pluginSlug: string,
    version: string,
    actorId: string,
    autoEnable = false,
    overwrite = false,
    metadata: Record<string, unknown> = {},
  ) {

    const publication =
      await this.versions.details(
        pluginSlug,
        version,
      );

    return this.lifecycleMetrics.observe(
      'install',
      () =>
        this.installer.install({
          publicationId:
            publication.publicationId,
          actorId,
          autoEnable,
          overwrite,
          metadata,
        }),
    );
  }

}
