import {
  MarketplacePublisherProfile,
} from '../entities/marketplace-publisher.entity';
import {
  MarketplacePlugin,
} from '../entities/marketplace-plugin.entity';

export abstract class MarketplacePublisherRepository {
  abstract listPublishers():
    Promise<MarketplacePublisherProfile[]>;

  abstract findPublisher(
    publisherId: string,
  ): Promise<MarketplacePublisherProfile | null>;

  abstract listPublisherPlugins(
    publisherId: string,
  ): Promise<MarketplacePlugin[]>;
}
