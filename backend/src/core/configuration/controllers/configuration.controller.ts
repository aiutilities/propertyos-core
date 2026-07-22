import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { CreateSettingDto } from "../dto/create-setting.dto";
import { UpdateSettingDto } from "../dto/update-setting.dto";
import { ConfigurationService } from "../services/configuration.service";
import { ConfigurationScope } from "../types/configuration.types";

import { Permissions } from "../../auth/constants/permissions";
import { RequirePermission } from "../../auth/decorators/require-permission.decorator";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { PermissionGuard } from "../../auth/guards/permission.guard";
@ApiTags("Configuration")
@ApiBearerAuth("JWT")
@Controller("configuration")
@UseGuards(JwtAuthGuard, PermissionGuard)
export class ConfigurationController {
  constructor(private readonly configurationService: ConfigurationService) {}

  @Post("settings")
  @RequirePermission(Permissions.CONFIGURATION_MANAGE)
  async upsert(@Body() dto: CreateSettingDto) {
    return {
      success: true,
      data: {
        setting: await this.configurationService.upsert(dto),
      },
    };
  }

  @Get("settings")
  @RequirePermission(Permissions.CONFIGURATION_READ)
  async list(
    @Query("scopeType") scopeType?: ConfigurationScope,
    @Query("scopeId") scopeId?: string,
  ) {
    return {
      success: true,
      data: {
        settings: await this.configurationService.list(scopeType, scopeId),
      },
    };
  }

  @Get("settings/:scopeType/:key")
  @RequirePermission(Permissions.CONFIGURATION_READ)
  async getByScopeAndKey(
    @Param("scopeType") scopeType: ConfigurationScope,
    @Param("key") key: string,
    @Query("scopeId") scopeId?: string,
  ) {
    return {
      success: true,
      data: {
        setting: await this.configurationService.getByScopeAndKey(
          scopeType,
          scopeId,
          key,
        ),
      },
    };
  }

  @Patch("settings/:id")
  @RequirePermission(Permissions.CONFIGURATION_MANAGE)
  async update(@Param("id") id: string, @Body() dto: UpdateSettingDto) {
    return {
      success: true,
      data: {
        setting: await this.configurationService.update(id, dto),
      },
    };
  }

  @Delete("settings/:id")
  @RequirePermission(Permissions.CONFIGURATION_MANAGE)
  async delete(@Param("id") id: string) {
    await this.configurationService.delete(id);

    return {
      success: true,
      data: {
        deleted: true,
      },
    };
  }
}
