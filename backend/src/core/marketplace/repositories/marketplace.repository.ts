import { MarketplacePlugin } from '../entities/marketplace-plugin.entity';

export abstract class MarketplaceRepository {
  abstract list(): Promise<MarketplacePlugin[]>;

  abstract findBySlug(
    slug: string,
  ): Promise<MarketplacePlugin | null>;
}
