import {
  Controller,
  Get,
  Param,
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
  MarketplaceResolutionPlannerService,
} from '../services/marketplace-resolution-planner.service';

@ApiTags('Marketplace Resolution')
@ApiBearerAuth('JWT')
@Controller('marketplace')
@UseGuards(
  JwtAuthGuard,
  PermissionGuard,
)
export class MarketplaceResolutionController {
  constructor(
    private readonly planner:
      MarketplaceResolutionPlannerService,
  ) {}

  @Get(':slug/versions/:version/resolution')
  @RequirePermission(
    Permissions.PLUGIN_READ,
  )
  resolution(
    @Param('slug')
    slug: string,
    @Param('version')
    version: string,
  ) {
    return this.planner.plan(
      slug,
      version,
    );
  }
}
