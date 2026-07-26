import {
  Body,
  Controller,
  Param,
  Post,
  UseGuards,
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
