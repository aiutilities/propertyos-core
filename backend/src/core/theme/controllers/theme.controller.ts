import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { InstallThemeDto } from "../dto/install-theme.dto";
import { ThemeService } from "../services/theme.service";

import { Permissions } from "../../auth/constants/permissions";
import { RequirePermission } from "../../auth/decorators/require-permission.decorator";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { PermissionGuard } from "../../auth/guards/permission.guard";
@ApiTags("Themes")
@ApiBearerAuth("JWT")
@Controller("themes")
@UseGuards(JwtAuthGuard, PermissionGuard)
export class ThemeController {
  constructor(private readonly themeService: ThemeService) {}

  @Get()
  @RequirePermission(Permissions.THEME_READ)
  list() {
    return {
      success: true,
      data: this.themeService.list(),
    };
  }

  @Get("active")
  @RequirePermission(Permissions.THEME_READ)
  active() {
    return {
      success: true,
      data: this.themeService.getActive(),
    };
  }

  @Get(":id")
  @RequirePermission(Permissions.THEME_READ)
  get(@Param("id") id: string) {
    return {
      success: true,
      data: this.themeService.get(id),
    };
  }

  @Post()
  @RequirePermission(Permissions.THEME_MANAGE)
  install(@Body() dto: InstallThemeDto) {
    return this.themeService.install(dto);
  }

  @Post(":id/activate")
  @RequirePermission(Permissions.THEME_MANAGE)
  activate(@Param("id") id: string) {
    return this.themeService.activate(id);
  }
}
