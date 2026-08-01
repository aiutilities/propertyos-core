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
  CancelMaterialReturnDto,
  CreateMaterialReturnDto,
  PostMaterialReturnDto,
} from '../dto';

import {
  INVENTORY_PERMISSIONS,
} from '../inventory.constants';

import {
  InventoryMaterialReturnService,
} from '../services/inventory-material-return.service';

@ApiTags(
  'Inventory Material Returns',
)
@ApiBearerAuth('JWT')
@UseGuards(
  JwtAuthGuard,
  PermissionGuard,
)
@Controller(
  '/inventory/material-returns',
)
export class InventoryMaterialReturnController {
  constructor(
    private readonly service:
      InventoryMaterialReturnService,
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

    @Query('materialIssueId')
    materialIssueId?: string,

    @Query('status')
    status?: string,

    @Query('dateFrom')
    dateFrom?: string,

    @Query('dateTo')
    dateTo?: string,
  ) {
    return this.success(
      await this.service
        .listMaterialReturns({
          propertyId,
          storeId,
          materialIssueId,
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
        .getMaterialReturn(
          id,
        ),
    );
  }

  @RequirePermission(
    INVENTORY_PERMISSIONS.RETURN,
  )
  @Post()
  async create(
    @Body()
    dto:
      CreateMaterialReturnDto,
  ) {
    return this.success(
      await this.service
        .createMaterialReturn(
          dto,
        ),
    );
  }

  @RequirePermission(
    INVENTORY_PERMISSIONS.RETURN,
  )
  @Post(':id/post')
  async postMaterialReturn(
    @Param('id')
    id: string,

    @Body()
    dto:
      PostMaterialReturnDto,
  ) {
    return this.success(
      await this.service
        .postMaterialReturn(
          id,
          dto,
        ),
    );
  }

  @RequirePermission(
    INVENTORY_PERMISSIONS.RETURN,
  )
  @Post(':id/cancel')
  async cancel(
    @Param('id')
    id: string,

    @Body()
    dto:
      CancelMaterialReturnDto,
  ) {
    return this.success(
      await this.service
        .cancelMaterialReturn(
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
