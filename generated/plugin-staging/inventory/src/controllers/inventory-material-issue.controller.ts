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
} from '@nestjs/common';

import {
  RequirePermission,
} from '@propertyos/core-contracts';

import {
  JwtAuthGuard,
} from '@propertyos/core-contracts';

import {
  PermissionGuard,
} from '@propertyos/core-contracts';

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
