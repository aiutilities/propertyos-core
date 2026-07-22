import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

import { Permissions } from "../../../auth/constants/permissions";
import { RequirePermission } from "../../../auth/decorators/require-permission.decorator";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { PermissionGuard } from "../../../auth/guards/permission.guard";
import { SearchMarketplaceDto } from "../dto/search-marketplace.dto";
import { PluginMarketplaceService } from "../services/plugin-marketplace.service";

@ApiTags("Plugin Marketplace")
@ApiBearerAuth("JWT")
@Controller("plugin-marketplace")
@UseGuards(JwtAuthGuard, PermissionGuard)
export class PluginMarketplaceController {
  constructor(private readonly service: PluginMarketplaceService) {}

  @Get()
  @RequirePermission(Permissions.PLUGIN_READ)
  async list() {
    return {
      success: true,
      data: await this.service.list(),
    };
  }

  @Post("search")
  @RequirePermission(Permissions.PLUGIN_READ)
  async search(
    @Body()
    dto: SearchMarketplaceDto,
  ) {
    return {
      success: true,
      data: await this.service.search(dto),
    };
  }

  @Get(":id")
  @RequirePermission(Permissions.PLUGIN_READ)
  async get(
    @Param("id")
    id: string,
  ) {
    return {
      success: true,
      data: await this.service.get(id),
    };
  }
}
