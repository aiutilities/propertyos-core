import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import { PluginService } from "../services/plugin.service";
import { CreatePluginDto } from "../dto/create-plugin.dto";
import { PluginTransitionDto } from "../dto/plugin-transition.dto";
import { UpgradePluginDto } from "../dto/upgrade-plugin.dto";
import { RollbackPluginDto } from "../dto/rollback-plugin.dto";

import { Permissions } from "../../auth/constants/permissions";
import { RequirePermission } from "../../auth/decorators/require-permission.decorator";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { PermissionGuard } from "../../auth/guards/permission.guard";
@ApiTags("Plugins")
@ApiBearerAuth("JWT")
@Controller("plugins")
@UseGuards(JwtAuthGuard, PermissionGuard)
export class PluginController {
  constructor(private readonly service: PluginService) {}

  @Get()
  @RequirePermission(Permissions.PLUGIN_READ)
  list() {
    return this.service.list();
  }

  @Get("installed")
  @RequirePermission(Permissions.PLUGIN_READ)
  installed() {
    return this.service.installedPlugins();
  }

  @Post()
  @RequirePermission(Permissions.PLUGIN_CREATE)
  install(@Body() dto: CreatePluginDto) {
    return this.service.install(dto);
  }

  @Get(":id")
  @RequirePermission(Permissions.PLUGIN_READ)
  getInstalled(@Param("id") id: string) {
    return this.service.getInstalledPlugin(id);
  }

  @Get(":id/capabilities")
  @RequirePermission(Permissions.PLUGIN_READ)
  capabilities(@Param("id") id: string) {
    return this.service.getPluginCapabilities(id);
  }

  @Get(":id/diagnostics")
  @RequirePermission(Permissions.PLUGIN_READ)
  diagnostics(@Param("id") id: string) {
    return this.service.getPluginDiagnostics(id);
  }

  @Get(":id/load-report")
  @RequirePermission(Permissions.PLUGIN_READ)
  async loadReport(@Param("id") id: string) {
    const diagnostics = await this.service.getPluginDiagnostics(id);

    return {
      success: true,
      data: diagnostics.loadReport ?? [],
    };
  }

  @Get(":id/lifecycle")
  @RequirePermission(Permissions.PLUGIN_READ)
  lifecycleStatus(@Param("id") id: string) {
    return this.service.getPluginLifecycle(id);
  }

  @Post(":id/upgrade")
  @RequirePermission(Permissions.PLUGIN_MANAGE)
  upgrade(@Param("id") id: string, @Body() dto: UpgradePluginDto) {
    return this.service.upgrade(id, dto);
  }

  @Post(":id/rollback")
  @RequirePermission(Permissions.PLUGIN_MANAGE)
  rollback(@Param("id") id: string, @Body() dto: RollbackPluginDto) {
    return this.service.rollback(id, dto);
  }

  @Post(":id/lifecycle")
  @RequirePermission(Permissions.PLUGIN_MANAGE)
  lifecycle(@Param("id") id: string, @Body() dto: PluginTransitionDto) {
    switch (dto.action) {
      case "ACTIVATE":
        return this.service.activate(id);
      case "DEACTIVATE":
        return this.service.deactivate(id);
      case "UNINSTALL":
        return this.service.uninstall(id);
    }
  }

  @Delete(":id")
  @RequirePermission(Permissions.PLUGIN_MANAGE)
  remove(@Param("id") id: string) {
    return this.service.remove(id);
  }
}
