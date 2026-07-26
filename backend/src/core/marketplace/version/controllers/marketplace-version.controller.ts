import {
  Controller,
  Get,
  Param,
} from '@nestjs/common';

import {
  MarketplaceVersionService,
} from '../services/marketplace-version.service';

@Controller('marketplace/:slug/versions')
export class MarketplaceVersionController {
  constructor(
    private readonly service:
      MarketplaceVersionService,
  ) {}

  @Get()
  list(
    @Param('slug')
    slug: string,
  ) {
    return this.service.list(slug);
  }

  @Get(':version')
  details(
    @Param('slug')
    slug: string,
    @Param('version')
    version: string,
  ) {
    return this.service.details(
      slug,
      version,
    );
  }
}
