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
  CancelStockAdjustmentDto,
  CreateStockAdjustmentDto,
  PostStockAdjustmentDto,
} from '../dto';

import {
  INVENTORY_PERMISSIONS,
} from '../inventory.constants';

import {
  InventoryStockAdjustmentService,
} from '../services/inventory-stock-adjustment.service';

@ApiTags('Inventory Stock Adjustments')
@ApiBearerAuth('JWT')
@UseGuards(
  JwtAuthGuard,
  PermissionGuard,
)
@Controller('/inventory/adjustments')
export class InventoryStockAdjustmentController {
  constructor(
    private readonly service:
      InventoryStockAdjustmentService,
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
        .listAdjustments({
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
        .getAdjustment(id),
    );
  }

  @RequirePermission(
    INVENTORY_PERMISSIONS.ADJUST,
  )
  @Post()
  async create(
    @Body()
    dto:
      CreateStockAdjustmentDto,
  ) {
    return this.success(
      await this.service
        .createAdjustment(dto),
    );
  }

  @RequirePermission(
    INVENTORY_PERMISSIONS.ADJUST,
  )
  @Post(':id/post')
  async postAdjustment(
    @Param('id')
    id: string,

    @Body()
    dto:
      PostStockAdjustmentDto,
  ) {
    return this.success(
      await this.service
        .postAdjustment(
          id,
          dto,
        ),
    );
  }

  @RequirePermission(
    INVENTORY_PERMISSIONS.ADJUST,
  )
  @Post(':id/cancel')
  async cancel(
    @Param('id')
    id: string,

    @Body()
    dto:
      CancelStockAdjustmentDto,
  ) {
    return this.success(
      await this.service
        .cancelAdjustment(
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
