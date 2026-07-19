import {
  ApiBearerAuth,
  ApiTags,
} from '@nestjs/swagger';
import {
  Body,
  Controller,
  Get,
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
  PluginPublicationAdmissionService,
} from './plugin-publication-admission.service';
import {
  PluginPublicationGovernanceService,
} from './plugin-publication-governance.service';
import {
  SubmitPluginPublicationDto,
} from './submit-plugin-publication.dto';
import {
  TransitionPluginPublicationDto,
} from './transition-plugin-publication.dto';

@ApiTags('Plugin Publication Governance')
@ApiBearerAuth('JWT')
@Controller('plugin-publications')
@UseGuards(
  JwtAuthGuard,
  PermissionGuard,
)
export class PluginPublicationGovernanceController {
  constructor(
    private readonly admission:
      PluginPublicationAdmissionService,
    private readonly governance:
      PluginPublicationGovernanceService,
  ) {}

  @Post()
  @RequirePermission(
    Permissions.PLUGIN_MANAGE,
  )
  submit(
    @Body()
    dto: SubmitPluginPublicationDto,
    @CurrentUser()
    user: AuthTokenPayload,
  ) {
    return this.admission.admit({
      storageObjectId:
        dto.storageObjectId,
      metadata:
        dto.metadata,
      actorId:
        user.sub,
    });
  }

  @Post(':id/transition')
  @RequirePermission(
    Permissions.PLUGIN_MANAGE,
  )
  transition(
    @Param('id')
    publicationId: string,
    @Body()
    dto:
      TransitionPluginPublicationDto,
    @CurrentUser()
    user: AuthTokenPayload,
  ) {
    return this.governance.transition({
      publicationId,
      targetStatus:
        dto.targetStatus,
      reason:
        dto.reason,
      metadata:
        dto.metadata,
      actorId:
        user.sub,
    });
  }

  @Get(':id/events')
  @RequirePermission(
    Permissions.PLUGIN_MANAGE,
  )
  events(
    @Param('id')
    publicationId: string,
  ) {
    return this.governance.listEvents(
      publicationId,
    );
  }

  @Get(':id')
  @RequirePermission(
    Permissions.PLUGIN_MANAGE,
  )
  get(
    @Param('id')
    publicationId: string,
  ) {
    return this.governance.get(
      publicationId,
    );
  }
}
