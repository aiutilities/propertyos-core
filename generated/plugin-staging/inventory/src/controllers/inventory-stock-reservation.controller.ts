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
  CreateStockReservationDto,
  ExpireStockReservationDto,
  FulfillStockReservationDto,
  ReleaseStockReservationDto,
} from '../dto';

import {
  INVENTORY_PERMISSIONS,
} from '../inventory.constants';

import {
  InventoryStockReservationService,
} from '../services/inventory-stock-reservation.service';

@ApiTags('Inventory Stock Reservations')
@ApiBearerAuth('JWT')
@UseGuards(
  JwtAuthGuard,
  PermissionGuard,
)
@Controller('/inventory/reservations')
export class InventoryStockReservationController {
  constructor(
    private readonly service:
      InventoryStockReservationService,
  ) {}

  @RequirePermission(
    INVENTORY_PERMISSIONS.READ,
  )
  @Get()
  async list(
    @Query('itemId')
    itemId?: string,

    @Query('storeId')
    storeId?: string,

    @Query('binLocationId')
    binLocationId?: string,

    @Query('batchId')
    batchId?: string,

    @Query('sourceType')
    sourceType?: string,

    @Query('sourceId')
    sourceId?: string,

    @Query('status')
    status?: string,
  ) {
    return this.success(
      await this.service
        .listReservations({
          itemId,
          storeId,
          binLocationId,
          batchId,
          sourceType,
          sourceId,
          status,
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
        .getReservation(id),
    );
  }

  @RequirePermission(
    INVENTORY_PERMISSIONS.STOCK,
  )
  @Post()
  async create(
    @Body()
    dto:
      CreateStockReservationDto,
  ) {
    return this.success(
      await this.service
        .createReservation(dto),
    );
  }

  @RequirePermission(
    INVENTORY_PERMISSIONS.STOCK,
  )
  @Post(':id/release')
  async release(
    @Param('id')
    id: string,

    @Body()
    dto:
      ReleaseStockReservationDto,
  ) {
    return this.success(
      await this.service
        .releaseReservation(
          id,
          dto,
        ),
    );
  }

  @RequirePermission(
    INVENTORY_PERMISSIONS.STOCK,
  )
  @Post(':id/fulfill')
  async fulfill(
    @Param('id')
    id: string,

    @Body()
    dto:
      FulfillStockReservationDto,
  ) {
    return this.success(
      await this.service
        .fulfillReservation(
          id,
          dto,
        ),
    );
  }

  @RequirePermission(
    INVENTORY_PERMISSIONS.MANAGE,
  )
  @Post(':id/expire')
  async expire(
    @Param('id')
    id: string,

    @Body()
    dto:
      ExpireStockReservationDto,
  ) {
    return this.success(
      await this.service
        .expireReservation(
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
