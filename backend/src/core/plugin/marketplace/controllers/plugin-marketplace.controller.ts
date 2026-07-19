import {
  ApiTags,
} from '@nestjs/swagger';
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
} from '@nestjs/common';
import {
  SearchMarketplaceDto,
} from '../dto/search-marketplace.dto';
import {
  PluginMarketplaceService,
} from '../services/plugin-marketplace.service';

@ApiTags('Plugin Marketplace')
@Controller('plugin-marketplace')
export class PluginMarketplaceController {
  constructor(
    private readonly service:
      PluginMarketplaceService,
  ) {}

  @Get()
  async list() {
    return {
      success: true,
      data:
        await this.service.list(),
    };
  }

  @Post('search')
  async search(
    @Body()
    dto: SearchMarketplaceDto,
  ) {
    return {
      success: true,
      data:
        await this.service.search(
          dto,
        ),
    };
  }

  @Get(':id')
  async get(
    @Param('id')
    id: string,
  ) {
    return {
      success: true,
      data:
        await this.service.get(id),
    };
  }
}
