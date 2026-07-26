import {
  Controller,
  Get,
  Param,
} from '@nestjs/common';

import {
  MarketplacePublisherService,
} from '../services/marketplace-publisher.service';

@Controller('marketplace/publishers')
export class MarketplacePublisherController {
  constructor(
    private readonly service:
      MarketplacePublisherService,
  ) {}

  @Get()
  list() {
    return this.service.list();
  }

  @Get(':publisherId')
  details(
    @Param('publisherId')
    publisherId: string,
  ) {
    return this.service.details(publisherId);
  }

  @Get(':publisherId/plugins')
  plugins(
    @Param('publisherId')
    publisherId: string,
  ) {
    return this.service.plugins(publisherId);
  }
}
