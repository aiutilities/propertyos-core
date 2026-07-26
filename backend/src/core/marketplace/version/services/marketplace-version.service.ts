import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  MarketplacePluginVersion,
} from '../entities/marketplace-plugin-version.entity';
import {
  MarketplaceVersionRepository,
} from '../repositories/marketplace-version.repository';

@Injectable()
export class MarketplaceVersionService {
  constructor(
    private readonly repository:
      MarketplaceVersionRepository,
  ) {}

  async list(
    slug: string,
  ): Promise<MarketplacePluginVersion[]> {
    const versions =
      await this.repository.list(slug);

    if (!versions) {
      throw new NotFoundException(
        'MARKETPLACE_PLUGIN_NOT_FOUND',
      );
    }

    return versions;
  }

  async details(
    slug: string,
    version: string,
  ): Promise<MarketplacePluginVersion> {
    const result =
      await this.repository.get(
        slug,
        version,
      );

    if (!result) {
      throw new NotFoundException(
        'MARKETPLACE_VERSION_NOT_FOUND',
      );
    }

    return result;
  }
}
