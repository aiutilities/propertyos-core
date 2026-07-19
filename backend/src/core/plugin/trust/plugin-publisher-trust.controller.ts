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
  CurrentUser,
} from '../../auth/decorators/current-user.decorator';
import {
  Permissions,
} from '../../auth/constants/permissions';
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
  PluginPublisherTrustLifecycleService,
} from './plugin-publisher-trust-lifecycle.service';
import {
  RevokePluginPublisherKeyDto,
} from './revoke-plugin-publisher-key.dto';

@ApiTags('Plugin Publisher Trust')
@ApiBearerAuth('JWT')
@Controller('plugin-publishers')
@UseGuards(
  JwtAuthGuard,
  PermissionGuard,
)
export class PluginPublisherTrustController {
  constructor(
    private readonly lifecycle:
      PluginPublisherTrustLifecycleService,
  ) {}

  @Post(':publisherId/keys/:keyId/revoke')
  @RequirePermission(
    Permissions.PLUGIN_MANAGE,
  )
  revokeKey(
    @Param('publisherId')
    publisherId: string,
    @Param('keyId')
    keyId: string,
    @Body()
    dto: RevokePluginPublisherKeyDto,
    @CurrentUser()
    user: AuthTokenPayload,
  ) {
    return this.lifecycle.revokeKey({
      publisherId,
      keyId,
      actorId:
        user.sub,
      reason:
        dto.reason,
      metadata:
        dto.metadata,
    });
  }
}
