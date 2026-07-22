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
import { InstallDistributionDto } from "../dto/install-distribution.dto";
import { RegisterDistributionDto } from "../dto/register-distribution.dto";
import { DistributionService } from "../services/distribution.service";

import { Permissions } from "../../auth/constants/permissions";
import { RequirePermission } from "../../auth/decorators/require-permission.decorator";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { PermissionGuard } from "../../auth/guards/permission.guard";
@ApiTags("Distributions")
@ApiBearerAuth("JWT")
@Controller("distributions")
@UseGuards(JwtAuthGuard, PermissionGuard)
export class DistributionController {
  constructor(private readonly distributionService: DistributionService) {}

  @Post()
  @RequirePermission(Permissions.DISTRIBUTION_MANAGE)
  register(@Body() dto: RegisterDistributionDto) {
    return this.distributionService.register(dto);
  }

  @Get()
  @RequirePermission(Permissions.DISTRIBUTION_READ)
  list() {
    return this.distributionService.list();
  }

  @Get("active")
  @RequirePermission(Permissions.DISTRIBUTION_READ)
  getActive() {
    return this.distributionService.getActive();
  }

  @Get(":id")
  @RequirePermission(Permissions.DISTRIBUTION_READ)
  get(@Param("id") id: string) {
    return this.distributionService.get(id);
  }

  @Patch("install")
  @RequirePermission(Permissions.DISTRIBUTION_MANAGE)
  install(@Body() dto: InstallDistributionDto) {
    return this.distributionService.install(dto);
  }

  @Patch(":id/activate")
  @RequirePermission(Permissions.DISTRIBUTION_MANAGE)
  activate(@Param("id") id: string) {
    return this.distributionService.activate(id);
  }

  @Patch(":id/archive")
  @RequirePermission(Permissions.DISTRIBUTION_MANAGE)
  archive(@Param("id") id: string) {
    return this.distributionService.archive(id);
  }
}
