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
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

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
  IdempotentOperation,
} from '../../platform/idempotency/decorators/idempotent-operation.decorator';
import {
  PlatformIdempotencyInterceptor,
} from '../../platform/idempotency/http/platform-idempotency.interceptor';

import {
  CancelMaterialIssueDto,
  CreateMaterialIssueDto,
  PostMaterialIssueDto,
} from '../dto';

import {
  INVENTORY_PERMISSIONS,
} from '../inventory.constants';

import {
  InventoryMaterialIssueService,
} from '../services/inventory-material-issue.service';

@ApiTags(
  'Inventory Material Issues',
)
@ApiBearerAuth('JWT')
@UseGuards(
  JwtAuthGuard,
  PermissionGuard,
)
@Controller(
  '/inventory/material-issues',
)
export class InventoryMaterialIssueController {
  constructor(
    private readonly service:
      InventoryMaterialIssueService,
  ) {}

  @RequirePermission(
    INVENTORY_PERMISSIONS.READ,
  )
  @Get()
  async list(
    @Query('propertyId')
    propertyId?: string,

    @Query('storeId')
    storeId?: string,

    @Query('status')
    status?: string,

    @Query('dateFrom')
    dateFrom?: string,

    @Query('dateTo')
    dateTo?: string,
  ) {
    return this.success(
      await this.service
        .listMaterialIssues({
          propertyId,
          storeId,
          status,
          dateFrom,
          dateTo,
        }),
    );
  }

  @RequirePermission(
    INVENTORY_PERMISSIONS.READ,
  )
  @Get(':id')
  async get(
    @Param('id')
    id: string,
  ) {
    return this.success(
      await this.service
        .getMaterialIssue(
          id,
        ),
    );
  }

  @RequirePermission(
    INVENTORY_PERMISSIONS.ISSUE,
  )
  @Post()
  async create(
    @Body()
    dto:
      CreateMaterialIssueDto,
  ) {
    return this.success(
      await this.service
        .createMaterialIssue(
          dto,
        ),
    );
  }

  @RequirePermission(
    INVENTORY_PERMISSIONS.ISSUE,
  )
  @UseInterceptors(
    PlatformIdempotencyInterceptor,
  )
  @IdempotentOperation({
    operation:
      'inventory.material-issue.post',
    required:
      true,
    expiresInSeconds:
      24 * 60 * 60,
    resource:
      (request) =>
        `inventory-material-issue:${request.params.id}`,
  })
  @Post(':id/post')
  async postMaterialIssue(
    @Param('id')
    id: string,

    @Body()
    dto:
      PostMaterialIssueDto,
  ) {
    return this.success(
      await this.service
        .postMaterialIssue(
          id,
          dto,
        ),
    );
  }

  @RequirePermission(
    INVENTORY_PERMISSIONS.ISSUE,
  )
  @Post(':id/cancel')
  async cancel(
    @Param('id')
    id: string,

    @Body()
    dto:
      CancelMaterialIssueDto,
  ) {
    return this.success(
      await this.service
        .cancelMaterialIssue(
          id,
          dto,
        ),
    );
  }

  private success(
    data: unknown,
  ) {
    return {
      success: true,
      data,
    };
  }
}
