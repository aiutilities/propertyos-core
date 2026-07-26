import {
  Body,
  Controller,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';

import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../../auth/guards/permission.guard';
import { CurrentUser } from '../../../auth/decorators/current-user.decorator';
import { RequirePermission } from '../../../auth/decorators/require-permission.decorator';
import { Permissions } from '../../../auth/constants/permissions';
import { AuthTokenPayload } from '../../../auth/services/auth.service';

import { MarketplaceInstallService } from '../services/marketplace-install.service';
import { InstallMarketplacePluginDto } from '../dto/install-marketplace-plugin.dto';

@ApiTags('Marketplace Install')
@ApiBearerAuth('JWT')
@Controller('marketplace')
@UseGuards(
  JwtAuthGuard,
  PermissionGuard,
)
export class MarketplaceInstallController {

  constructor(
    private readonly service: MarketplaceInstallService,
  ) {}

  @Post(':slug/versions/:version/install')
  @RequirePermission(Permissions.PLUGIN_MANAGE)
  install(
    @Param('slug') slug: string,
    @Param('version') version: string,
    @Body() dto: InstallMarketplacePluginDto,
    @CurrentUser() user: AuthTokenPayload,
  ) {
    return this.service.install(
      slug,
      version,
      user.sub,
      dto.autoEnable,
      dto.overwrite,
      dto.metadata ?? {},
    );
  }

}
