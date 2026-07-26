import { Module } from '@nestjs/common';

import { PostgresModule } from '../../database/postgres/postgres.module';

import { MarketplaceController } from './controllers/marketplace.controller';
import { MarketplaceRepository } from './repositories/marketplace.repository';
import { PostgresMarketplaceRepository } from './repositories/postgres-marketplace.repository';
import { MarketplaceCatalogService } from './services/marketplace-catalog.service';

@Module({
  imports: [PostgresModule],
  controllers: [
    MarketplaceController,
  ],
  providers: [
    MarketplaceCatalogService,
    {
      provide: MarketplaceRepository,
      useClass: PostgresMarketplaceRepository,
    },
  ],
})
export class MarketplaceModule {}
