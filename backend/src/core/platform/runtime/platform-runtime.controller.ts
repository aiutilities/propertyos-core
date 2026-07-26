import {
  Controller,
  Get,
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
  PlatformRuntimeService,
} from './platform-runtime.service';

@ApiTags('Platform')
@ApiBearerAuth('JWT')
@Controller('platform')
@UseGuards(
  JwtAuthGuard,
  PermissionGuard,
)
export class PlatformRuntimeController {
  constructor(
    private readonly runtime:
      PlatformRuntimeService,
  ) {}

  @Get('runtime')
  @RequirePermission(
    Permissions.ADMIN_READ,
  )
  getRuntime() {
    return {
      success: true,
      data:
        this.runtime.publicContext(),
    };
  }
}
