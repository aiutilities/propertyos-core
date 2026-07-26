import {
  Module,
} from '@nestjs/common';

import {
  PostgresModule,
} from '../../database/postgres/postgres.module';
import {
  MarketplacePublisherController,
} from './controllers/marketplace-publisher.controller';
import {
  MarketplaceController,
} from './controllers/marketplace.controller';
import {
  MarketplacePublisherRepository,
} from './repositories/marketplace-publisher.repository';
import {
  MarketplaceRepository,
} from './repositories/marketplace.repository';
import {
  PostgresMarketplacePublisherRepository,
} from './repositories/postgres-marketplace-publisher.repository';
import {
  PostgresMarketplaceRepository,
} from './repositories/postgres-marketplace.repository';
import {
  MarketplaceCatalogService,
} from './services/marketplace-catalog.service';
import {
  MarketplacePublisherService,
} from './services/marketplace-publisher.service';
import {
  MarketplaceVersionController,
} from './version/controllers/marketplace-version.controller';
import {
  MarketplaceVersionRepository,
} from './version/repositories/marketplace-version.repository';
import {
  PostgresMarketplaceVersionRepository,
} from './version/repositories/postgres-marketplace-version.repository';
import {
  MarketplaceVersionService,
} from './version/services/marketplace-version.service';

@Module({
  imports: [
    PostgresModule,
  ],
  controllers: [
    MarketplacePublisherController,
    MarketplaceVersionController,
    MarketplaceController,
  ],
  providers: [
    MarketplaceCatalogService,
    MarketplacePublisherService,
    MarketplaceVersionService,
    {
      provide:
        MarketplaceRepository,
      useClass:
        PostgresMarketplaceRepository,
    },
    {
      provide:
        MarketplacePublisherRepository,
      useClass:
        PostgresMarketplacePublisherRepository,
    },
    {
      provide:
        MarketplaceVersionRepository,
      useClass:
        PostgresMarketplaceVersionRepository,
    },
  ],
})
export class MarketplaceModule {}
