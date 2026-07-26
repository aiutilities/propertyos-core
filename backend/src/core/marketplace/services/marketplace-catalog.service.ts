import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { MarketplacePlugin } from '../entities/marketplace-plugin.entity';
import { MarketplaceRepository } from '../repositories/marketplace.repository';

@Injectable()
export class MarketplaceCatalogService {
  constructor(
    private readonly repository:
      MarketplaceRepository,
  ) {}

  list(): Promise<MarketplacePlugin[]> {
    return this.repository.list();
  }

  async details(
    slug: string,
  ): Promise<MarketplacePlugin> {
    const plugin =
      await this.repository.findBySlug(slug);

    if (!plugin) {
      throw new NotFoundException(
        'Marketplace plugin not found',
      );
    }

    return plugin;
  }
}
