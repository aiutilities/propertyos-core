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
import {
  RegisterPluginPublisherDto,
} from './register-plugin-publisher.dto';
import {
  RegisterPluginPublisherKeyDto,
} from './register-plugin-publisher-key.dto';
import {
  TransitionPluginPublisherDto,
} from './transition-plugin-publisher.dto';

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

  @Post()
  @RequirePermission(
    Permissions.PLUGIN_MANAGE,
  )
  registerPublisher(
    @Body()
    dto: RegisterPluginPublisherDto,
    @CurrentUser()
    user: AuthTokenPayload,
  ) {
    return this.lifecycle.registerPublisher({
      publisherId:
        dto.publisherId,
      displayName:
        dto.displayName,
      actorId:
        user.sub,
      metadata:
        dto.metadata,
    });
  }

  @Post(':publisherId/keys')
  @RequirePermission(
    Permissions.PLUGIN_MANAGE,
  )
  registerKey(
    @Param('publisherId')
    publisherId: string,
    @Body()
    dto: RegisterPluginPublisherKeyDto,
    @CurrentUser()
    user: AuthTokenPayload,
  ) {
    return this.lifecycle.registerKey({
      publisherId,
      keyId:
        dto.keyId,
      publicKeyPem:
        dto.publicKeyPem,
      actorId:
        user.sub,
      validFrom:
        dto.validFrom
          ? new Date(
              dto.validFrom,
            )
          : undefined,
      validUntil:
        dto.validUntil
          ? new Date(
              dto.validUntil,
            )
          : undefined,
      metadata:
        dto.metadata,
    });
  }

  @Post(':publisherId/transition')
  @RequirePermission(
    Permissions.PLUGIN_MANAGE,
  )
  transitionPublisher(
    @Param('publisherId')
    publisherId: string,
    @Body()
    dto: TransitionPluginPublisherDto,
    @CurrentUser()
    user: AuthTokenPayload,
  ) {
    return this.lifecycle.transitionPublisher({
      publisherId,
      targetStatus:
        dto.targetStatus,
      actorId:
        user.sub,
      reason:
        dto.reason,
      metadata:
        dto.metadata,
    });
  }

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
