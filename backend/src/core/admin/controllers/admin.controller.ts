import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Controller, Get, UseGuards } from "@nestjs/common";
import { AdminService } from "../services/admin.service";

import { Permissions } from "../../auth/constants/permissions";
import { RequirePermission } from "../../auth/decorators/require-permission.decorator";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { PermissionGuard } from "../../auth/guards/permission.guard";
@ApiTags("Admin")
@ApiBearerAuth("JWT")
@Controller("admin")
@UseGuards(JwtAuthGuard, PermissionGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get("platform")
  @RequirePermission(Permissions.ADMIN_READ)
  async platform() {
    return {
      success: true,
      data: await this.adminService.getPlatformDiagnostics(),
    };
  }

  @Get("dashboard")
  @RequirePermission(Permissions.ADMIN_READ)
  async dashboard() {
    return {
      success: true,
      data: await this.adminService.getDashboard(),
    };
  }

  @Get("menu")
  @RequirePermission(Permissions.ADMIN_READ)
  menu() {
    return {
      success: true,
      data: this.adminService.getMenu(),
    };
  }

  @Get("widgets")
  @RequirePermission(Permissions.ADMIN_READ)
  widgets() {
    return {
      success: true,
      data: this.adminService.getWidgets(),
    };
  }
}
