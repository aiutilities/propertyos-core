import {
  ApiBearerAuth,
  ApiTags,
} from '@nestjs/swagger';
import {
  Body,
  Controller,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  Permissions,
} from '../../../auth/constants/permissions';
import {
  RequirePermission,
} from '../../../auth/decorators/require-permission.decorator';
import {
  JwtAuthGuard,
} from '../../../auth/guards/jwt-auth.guard';
import {
  PermissionGuard,
} from '../../../auth/guards/permission.guard';
import {
  InstallPluginPackageDto,
} from '../dto/install-plugin-package.dto';
import {
  PluginInstallerService,
} from '../services/plugin-installer.service';

@ApiTags('Plugin Installer')
@ApiBearerAuth('JWT')
@Controller('plugin-installer')
@UseGuards(
  JwtAuthGuard,
  PermissionGuard,
)
export class PluginInstallerController {
  constructor(
    private readonly pluginInstallerService:
      PluginInstallerService,
  ) {}

  @Post('install')
  @RequirePermission(
    Permissions.PLUGIN_MANAGE,
  )
  install(
    @Body()
    dto: InstallPluginPackageDto,
  ) {
    return this.pluginInstallerService.install({
      storageObjectId:
        dto.storageObjectId,
      autoEnable:
        dto.autoEnable,
      overwrite:
        dto.overwrite,
      metadata:
        dto.metadata,
    });
  }
}
