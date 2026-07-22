import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { RegisterPluginPackageDto } from "../dto/register-plugin-package.dto";
import { PluginPackageService } from "../services/plugin-package.service";

import { Permissions } from "../../../auth/constants/permissions";
import { RequirePermission } from "../../../auth/decorators/require-permission.decorator";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { PermissionGuard } from "../../../auth/guards/permission.guard";
@ApiTags("Plugin Packages")
@ApiBearerAuth("JWT")
@Controller("plugin-packages")
@UseGuards(JwtAuthGuard, PermissionGuard)
export class PluginPackageController {
  constructor(private readonly service: PluginPackageService) {}

  @Post()
  @RequirePermission(Permissions.PLUGIN_MANAGE)
  register(@Body() dto: RegisterPluginPackageDto) {
    return {
      success: true,
      data: this.service.register(dto),
    };
  }

  @Get()
  @RequirePermission(Permissions.PLUGIN_READ)
  list() {
    return {
      success: true,
      data: this.service.list(),
    };
  }

  @Get(":id")
  @RequirePermission(Permissions.PLUGIN_READ)
  get(@Param("id") id: string) {
    return {
      success: true,
      data: this.service.get(id),
    };
  }

  @Post(":id/validate")
  @RequirePermission(Permissions.PLUGIN_MANAGE)
  validate(@Param("id") id: string) {
    return {
      success: true,
      data: this.service.validate(id),
    };
  }
}
