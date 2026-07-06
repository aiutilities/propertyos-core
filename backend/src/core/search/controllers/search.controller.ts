import { Body, Controller, Get, Post } from '@nestjs/common';
import { SearchQueryDto } from '../dto/search-query.dto';
import { SearchService } from '../services/search.service';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Post()
  search(@Body() dto: SearchQueryDto) {
    return this.searchService.search(dto);
  }

  @Get('providers')
  providers() {
    return {
      success: true,
      data: this.searchService.providers().map((provider) => ({
        name: provider.name,
        entityType: provider.entityType,
      })),
    };
  }
}
