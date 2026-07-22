import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { RegisterThemePackageDto } from "../dto/register-theme-package.dto";
import { ThemePackageService } from "../services/theme-package.service";

import { Permissions } from "../../../auth/constants/permissions";
import { RequirePermission } from "../../../auth/decorators/require-permission.decorator";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { PermissionGuard } from "../../../auth/guards/permission.guard";
@ApiTags("Theme Packages")
@ApiBearerAuth("JWT")
@Controller("theme-packages")
@UseGuards(JwtAuthGuard, PermissionGuard)
export class ThemePackageController {
  constructor(private readonly themePackageService: ThemePackageService) {}

  @Post()
  @RequirePermission(Permissions.THEME_MANAGE)
  register(@Body() dto: RegisterThemePackageDto) {
    return this.themePackageService.register(dto);
  }

  @Get()
  @RequirePermission(Permissions.THEME_READ)
  list() {
    return this.themePackageService.list();
  }

  @Get(":id")
  @RequirePermission(Permissions.THEME_READ)
  get(@Param("id") id: string) {
    return this.themePackageService.get(id);
  }

  @Patch(":id/install")
  @RequirePermission(Permissions.THEME_MANAGE)
  install(@Param("id") id: string) {
    return this.themePackageService.install(id);
  }

  @Patch(":id/archive")
  @RequirePermission(Permissions.THEME_MANAGE)
  archive(@Param("id") id: string) {
    return this.themePackageService.archive(id);
  }
}
