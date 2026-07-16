import {
  ApiBearerAuth,
  ApiTags,
} from '@nestjs/swagger';

import {
  Body,
  Controller,
  Post,
  UseGuards,
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
  AllocateInventoryBatchesDto,
} from '../dto';

import {
  INVENTORY_PERMISSIONS,
} from '../inventory.constants';

import {
  InventoryBatchAllocationService,
} from '../services/inventory-batch-allocation.service';

@ApiTags('Inventory Batch Allocations')
@ApiBearerAuth('JWT')
@UseGuards(
  JwtAuthGuard,
  PermissionGuard,
)
@Controller('/inventory/batch-allocations')
export class InventoryBatchAllocationController {
  constructor(
    private readonly service:
      InventoryBatchAllocationService,
  ) {}

  @RequirePermission(
    INVENTORY_PERMISSIONS.READ,
  )
  @Post('preview')
  async preview(
    @Body()
    dto:
      AllocateInventoryBatchesDto,
  ) {
    return this.success(
      await this.service
        .allocate({
          itemId:
            dto.itemId,

          storeId:
            dto.storeId,

          binLocationId:
            dto.binLocationId,

          quantity:
            dto.quantity,

          strategy:
            dto.strategy,

          manualBatchIds:
            dto.manualBatchIds,

          asOf:
            dto.asOf
              ? new Date(
                  dto.asOf,
                )
              : undefined,

          strict:
            dto.strict,
        }),
    );
  }

  private success(
    data: unknown,
  ) {
    return {
      success:
        true,

      data,
    };
  }
}
