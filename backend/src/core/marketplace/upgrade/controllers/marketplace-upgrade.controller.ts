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
  UpgradeMarketplacePluginDto,
} from '../dto/upgrade-marketplace-plugin.dto';
import {
  MarketplaceUpgradeService,
} from '../services/marketplace-upgrade.service';

@ApiTags('Marketplace Upgrade')
@ApiBearerAuth('JWT')
@Controller('marketplace')
@UseGuards(
  JwtAuthGuard,
  PermissionGuard,
)
export class MarketplaceUpgradeController {
  constructor(
    private readonly service:
      MarketplaceUpgradeService,
  ) {}

  @Post(':slug/versions/:version/upgrade')
  @RequirePermission(
    Permissions.PLUGIN_MANAGE,
  )
  upgrade(
    @Param('slug')
    slug: string,
    @Param('version')
    version: string,
    @Body()
    dto: UpgradeMarketplacePluginDto,
  ) {
    return this.service.upgrade(
      slug,
      version,
      dto.notes,
    );
  }
}
