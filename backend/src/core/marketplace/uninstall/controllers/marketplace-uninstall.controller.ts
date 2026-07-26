import {
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
  MarketplaceUninstallService,
} from '../services/marketplace-uninstall.service';

@ApiTags('Marketplace Uninstall')
@ApiBearerAuth('JWT')
@Controller('marketplace')
@UseGuards(
  JwtAuthGuard,
  PermissionGuard,
)
export class MarketplaceUninstallController {
  constructor(
    private readonly service:
      MarketplaceUninstallService,
  ) {}

  @Post(':slug/uninstall')
  @RequirePermission(
    Permissions.PLUGIN_MANAGE,
  )
  uninstall(
    @Param('slug')
    slug: string,
  ) {
    return this.service.uninstall(
      slug,
    );
  }
}
