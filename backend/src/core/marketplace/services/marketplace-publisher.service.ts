import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  MarketplacePublisherDetails,
  MarketplacePublisherProfile,
} from '../entities/marketplace-publisher.entity';
import {
  MarketplacePlugin,
} from '../entities/marketplace-plugin.entity';
import {
  MarketplacePublisherRepository,
} from '../repositories/marketplace-publisher.repository';

@Injectable()
export class MarketplacePublisherService {
  constructor(
    private readonly repository:
      MarketplacePublisherRepository,
  ) {}

  list():
    Promise<MarketplacePublisherProfile[]> {
    return this.repository.listPublishers();
  }

  async details(
    publisherId: string,
  ): Promise<MarketplacePublisherDetails> {
    const publisher =
      await this.repository.findPublisher(
        publisherId,
      );

    if (!publisher) {
      throw new NotFoundException(
        'Marketplace publisher not found',
      );
    }

    const plugins =
      await this.repository.listPublisherPlugins(
        publisherId,
      );

    return {
      ...publisher,
      plugins,
    };
  }

  async plugins(
    publisherId: string,
  ): Promise<MarketplacePlugin[]> {
    const publisher =
      await this.repository.findPublisher(
        publisherId,
      );

    if (!publisher) {
      throw new NotFoundException(
        'Marketplace publisher not found',
      );
    }

    return this.repository.listPublisherPlugins(
      publisherId,
    );
  }
}
