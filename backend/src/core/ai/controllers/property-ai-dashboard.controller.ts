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
  PropertyAiDashboardService,
} from '../dashboard/property-ai-dashboard.service';


@ApiTags('AI')
@ApiBearerAuth('JWT')
@UseGuards(
  JwtAuthGuard,
  PermissionGuard,
)
@Controller('ai/properties')
export class PropertyAiDashboardController {


  constructor(
    private readonly dashboard:
      PropertyAiDashboardService,
  ) {}


  @Get(':propertyId/dashboard')
  @RequirePermission(
    Permissions.AI_EXECUTE,
  )
  getDashboard(
    @Param('propertyId')
    propertyId:
      string,
  ) {

    return this.dashboard.getDashboard(
      propertyId,
    );

  }

}
