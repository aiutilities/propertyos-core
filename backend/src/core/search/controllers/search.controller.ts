import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';

import { Permissions } from '../../auth/constants/permissions';
import { RequirePermission } from '../../auth/decorators/require-permission.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permission.guard';
import { SearchQueryDto } from '../dto/search-query.dto';
import { SearchService } from '../services/search.service';

@Controller('search')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Post()
  @RequirePermission(Permissions.SEARCH_READ)
  search(@Body() dto: SearchQueryDto) {
    return this.searchService.search(dto);
  }

  @Get('providers')
  @RequirePermission(Permissions.SEARCH_READ)
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
