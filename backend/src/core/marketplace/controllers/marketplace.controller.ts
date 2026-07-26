import {
  Controller,
  Get,
  Param,
  Query,
} from '@nestjs/common';

import {
  MarketplaceQueryDto,
} from '../dto/marketplace-query.dto';
import {
  MarketplaceCatalogService,
} from '../services/marketplace-catalog.service';

@Controller('marketplace')
export class MarketplaceController {
  constructor(
    private readonly service:
      MarketplaceCatalogService,
  ) {}

  @Get()
  list(
    @Query()
    query: MarketplaceQueryDto,
  ) {
    return this.service.list(query);
  }

  @Get(':slug')
  details(
    @Param('slug')
    slug: string,
  ) {
    return this.service.details(slug);
  }
}
