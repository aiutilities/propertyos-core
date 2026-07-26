import {
  MarketplaceSearchQuery,
} from '../dto/marketplace-query.dto';
import {
  MarketplacePlugin,
} from '../entities/marketplace-plugin.entity';

export interface MarketplaceSearchResult {
  items: MarketplacePlugin[];
  total: number;
}

export abstract class MarketplaceRepository {
  abstract search(
    query: MarketplaceSearchQuery,
  ): Promise<MarketplaceSearchResult>;

  abstract findBySlug(
    slug: string,
  ): Promise<MarketplacePlugin | null>;
}
