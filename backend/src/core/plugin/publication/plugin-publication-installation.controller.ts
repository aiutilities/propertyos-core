import {
  ApiBearerAuth,
  ApiTags,
} from '@nestjs/swagger';
import {
  Body,
  Controller,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  Permissions,
} from '../../auth/constants/permissions';
import {
  CurrentUser,
} from '../../auth/decorators/current-user.decorator';
import {
  RequirePermission,
} from '../../auth/decorators/require-permission.decorator';
import {
  JwtAuthGuard,
} from '../../auth/guards/jwt-auth.guard';
import {
  PermissionGuard,
} from '../../auth/guards/permission.guard';
import {
  AuthTokenPayload,
} from '../../auth/services/auth.service';
import {
  InstallPluginPublicationDto,
} from './install-plugin-publication.dto';
import {
  PluginPublicationInstallationService,
} from './plugin-publication-installation.service';

@ApiTags('Plugin Publication Installation')
@ApiBearerAuth('JWT')
@Controller('plugin-publication-installer')
@UseGuards(
  JwtAuthGuard,
  PermissionGuard,
)
export class PluginPublicationInstallationController {
  constructor(
    private readonly installation:
      PluginPublicationInstallationService,
  ) {}

  @Post(':publicationId/install')
  @RequirePermission(
    Permissions.PLUGIN_MANAGE,
  )
  install(
    @Param('publicationId')
    publicationId: string,
    @Body()
    dto: InstallPluginPublicationDto,
    @CurrentUser()
    user: AuthTokenPayload,
  ) {
    return this.installation.install({
      publicationId,
      actorId:
        user.sub,
      autoEnable:
        dto.autoEnable,
      overwrite:
        dto.overwrite,
      metadata:
        dto.metadata,
    });
  }
}
