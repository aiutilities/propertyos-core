import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { RegisterMarketplacePluginDto } from '../dto/register-marketplace-plugin.dto';
import { SearchMarketplaceDto } from '../dto/search-marketplace.dto';
import { PluginMarketplaceService } from '../services/plugin-marketplace.service';

@Controller('plugin-marketplace')
export class PluginMarketplaceController {
  constructor(private readonly service: PluginMarketplaceService) {}

  @Post()
  register(@Body() dto: RegisterMarketplacePluginDto) {
    return {
      success: true,
      data: this.service.register(dto),
    };
  }

  @Get()
  list() {
    return {
      success: true,
      data: this.service.list(),
    };
  }

  @Post('search')
  search(@Body() dto: SearchMarketplaceDto) {
    return {
      success: true,
      data: this.service.search(dto),
    };
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return {
      success: true,
      data: this.service.get(id),
    };
  }
}
