import { Controller, Get, Param } from '@nestjs/common';
import { MarketplaceCatalogService } from '../services/marketplace-catalog.service';

@Controller('marketplace')
export class MarketplaceController {

  constructor(
    private readonly service: MarketplaceCatalogService,
  ) {}

  @Get()
  async list() {
    return this.service.list();
  }

  @Get(':slug')
  async details(
    @Param('slug') slug: string,
  ) {
    return this.service.details(slug);
  }

}
