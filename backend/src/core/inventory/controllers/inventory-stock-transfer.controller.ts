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
  CancelStockTransferDto,
  CreateStockTransferDto,
  DispatchStockTransferDto,
  ReceiveStockTransferDto,
} from '../dto';

import {
  INVENTORY_PERMISSIONS,
} from '../inventory.constants';

import {
  InventoryStockTransferService,
} from '../services/inventory-stock-transfer.service';

@ApiTags('Inventory Stock Transfers')
@ApiBearerAuth('JWT')
@UseGuards(
  JwtAuthGuard,
  PermissionGuard,
)
@Controller('/inventory/transfers')
export class InventoryStockTransferController {
  constructor(
    private readonly service:
      InventoryStockTransferService,
  ) {}

  @RequirePermission(
    INVENTORY_PERMISSIONS.READ,
  )
  @Get()
  async list(
    @Query('propertyId')
    propertyId?: string,

    @Query('sourceStoreId')
    sourceStoreId?: string,

    @Query('destinationStoreId')
    destinationStoreId?: string,

    @Query('status')
    status?: string,

    @Query('dateFrom')
    dateFrom?: string,

    @Query('dateTo')
    dateTo?: string,
  ) {
    return this.success(
      await this.service
        .listTransfers({
          propertyId,
          sourceStoreId,
          destinationStoreId,
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
        .getTransfer(id),
    );
  }

  @RequirePermission(
    INVENTORY_PERMISSIONS.TRANSFER,
  )
  @Post()
  async create(
    @Body()
    dto:
      CreateStockTransferDto,
  ) {
    return this.success(
      await this.service
        .createTransfer(dto),
    );
  }

  @RequirePermission(
    INVENTORY_PERMISSIONS.TRANSFER,
  )
  @UseInterceptors(
    PlatformIdempotencyInterceptor,
  )
  @IdempotentOperation({
    operation:
      'inventory.stock-transfer.dispatch',
    required:
      true,
    expiresInSeconds:
      24 * 60 * 60,
    resource:
      (request) =>
        `inventory-stock-transfer:${request.params.id}`,
  })
  @Post(':id/dispatch')
  async dispatch(
    @Param('id')
    id: string,

    @Body()
    dto:
      DispatchStockTransferDto,
  ) {
    return this.success(
      await this.service
        .dispatchTransfer(
          id,
          dto,
        ),
    );
  }

  @RequirePermission(
    INVENTORY_PERMISSIONS.TRANSFER,
  )
  @UseInterceptors(
    PlatformIdempotencyInterceptor,
  )
  @IdempotentOperation({
    operation:
      'inventory.stock-transfer.receive',
    required:
      true,
    expiresInSeconds:
      24 * 60 * 60,
    resource:
      (request) =>
        `inventory-stock-transfer:${request.params.id}`,
  })
  @Post(':id/receive')
  async receive(
    @Param('id')
    id: string,

    @Body()
    dto:
      ReceiveStockTransferDto,
  ) {
    return this.success(
      await this.service
        .receiveTransfer(
          id,
          dto,
        ),
    );
  }

  @RequirePermission(
    INVENTORY_PERMISSIONS.TRANSFER,
  )
  @Post(':id/cancel')
  async cancel(
    @Param('id')
    id: string,

    @Body()
    dto:
      CancelStockTransferDto,
  ) {
    return this.success(
      await this.service
        .cancelTransfer(
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
