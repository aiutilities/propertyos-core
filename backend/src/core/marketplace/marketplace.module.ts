import { Module } from '@nestjs/common';
import { MarketplaceController } from './controllers/marketplace.controller';
import { MarketplaceCatalogService } from './services/marketplace-catalog.service';

@Module({
  controllers: [
    MarketplaceController,
  ],
  providers: [
    MarketplaceCatalogService,
  ],
})
export class MarketplaceModule {}
