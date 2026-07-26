import { Module } from '@nestjs/common';

import { PostgresModule } from '../../database/postgres/postgres.module';

import { MarketplaceController } from './controllers/marketplace.controller';
import { MarketplacePublisherService } from './services/marketplace-publisher.service';
import { PostgresMarketplacePublisherRepository } from './repositories/postgres-marketplace-publisher.repository';
import { MarketplacePublisherRepository } from './repositories/marketplace-publisher.repository';
import { MarketplacePublisherController } from './controllers/marketplace-publisher.controller';
import { MarketplaceRepository } from './repositories/marketplace.repository';
import { PostgresMarketplaceRepository } from './repositories/postgres-marketplace.repository';
import { MarketplaceCatalogService } from './services/marketplace-catalog.service';

@Module({
  imports: [PostgresModule],
  controllers: [
    MarketplacePublisherController,
    MarketplaceController,
  ],
  providers: [
    MarketplaceCatalogService,
    MarketplacePublisherService,
    {
      provide: MarketplaceRepository,
      useClass: PostgresMarketplaceRepository,
    },
    {
      provide: MarketplacePublisherRepository,
      useClass: PostgresMarketplacePublisherRepository,
    },
  ],
})
export class MarketplaceModule {}
