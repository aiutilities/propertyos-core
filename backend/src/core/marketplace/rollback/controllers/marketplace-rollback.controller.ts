import {
  Body,
  Controller,
  Param,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
} from '@nestjs/swagger';

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
  RollbackMarketplacePluginDto,
} from '../dto/rollback-marketplace-plugin.dto';
import {
  IdempotentOperation,
} from '../../../platform/idempotency/decorators/idempotent-operation.decorator';
import {
  PlatformIdempotencyInterceptor,
} from '../../../platform/idempotency/http/platform-idempotency.interceptor';

import {
  MarketplaceRollbackService,
} from '../services/marketplace-rollback.service';

@ApiTags('Marketplace Rollback')
@ApiBearerAuth('JWT')
@Controller('marketplace')
@UseGuards(
  JwtAuthGuard,
  PermissionGuard,
)
export class MarketplaceRollbackController {
  constructor(
    private readonly service:
      MarketplaceRollbackService,
  ) {}

  @Post(':slug/versions/:version/rollback')
  @RequirePermission(
    Permissions.PLUGIN_MANAGE,
  )
  @UseInterceptors(
    PlatformIdempotencyInterceptor,
  )
  @IdempotentOperation({
    operation:
      'marketplace.rollback',
    required:
      true,
    expiresInSeconds:
      24 * 60 * 60,
    resource:
      (request) =>
        `marketplace-plugin:${request.params.slug}@${request.params.version}`,
  })
  rollback(
    @Param('slug')
    slug: string,
    @Param('version')
    version: string,
    @Body()
    dto: RollbackMarketplacePluginDto,
  ) {
    return this.service.rollback(
      slug,
      version,
      dto.notes,
    );
  }
}
