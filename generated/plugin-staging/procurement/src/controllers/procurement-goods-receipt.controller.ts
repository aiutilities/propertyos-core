import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiTags,
} from '@nestjs/swagger';

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
  CreateProcurementGoodsReceiptDto,
} from '../dto/create-procurement-goods-receipt.dto';

import {
  PostProcurementGoodsReceiptDto,
} from '../dto/post-procurement-goods-receipt.dto';

import {
  ReverseProcurementGoodsReceiptDto,
} from '../dto/reverse-procurement-goods-receipt.dto';

import {
  UpdateProcurementGoodsReceiptDto,
} from '../dto/update-procurement-goods-receipt.dto';

import {
  PROCUREMENT_PERMISSIONS,
} from '../procurement.constants';

import {
  ProcurementGoodsReceiptService,
} from '../services/procurement-goods-receipt.service';

import {
  GoodsReceiptStatus,
} from '../types/procurement.types';

@ApiTags('Procurement Goods Receipts')
@ApiBearerAuth('JWT')
@Controller('/procurement/goods-receipts')
@UseGuards(
  JwtAuthGuard,
  PermissionGuard,
)
export class ProcurementGoodsReceiptController {
  constructor(
    private readonly service:
      ProcurementGoodsReceiptService,
  ) {}

  @RequirePermission(
    PROCUREMENT_PERMISSIONS.READ,
  )
  @Get()
  async list(
    @Query('purchaseOrderId')
    purchaseOrderId?: string,

    @Query('propertyId')
    propertyId?: string,

    @Query('vendorId')
    vendorId?: string,

    @Query('status')
    status?: GoodsReceiptStatus,

    @Query('search')
    search?: string,
  ) {
    return this.success(
      await this.service.list({
        purchaseOrderId,
        propertyId,
        vendorId,
        status,
        search,
      }),
    );
  }

  @RequirePermission(
    PROCUREMENT_PERMISSIONS.GOODS_RECEIPT,
  )
  @Post()
  async create(
    @Body()
    dto: CreateProcurementGoodsReceiptDto,
  ) {
    return this.success(
      await this.service.create(
        dto,
      ),
    );
  }

  @RequirePermission(
    PROCUREMENT_PERMISSIONS.READ,
  )
  @Get(':id')
  async get(
    @Param('id')
    id: string,
  ) {
    return this.success(
      await this.service.get(
        id,
      ),
    );
  }

  @RequirePermission(
    PROCUREMENT_PERMISSIONS.GOODS_RECEIPT,
  )
  @Patch(':id')
  async update(
    @Param('id')
    id: string,

    @Body()
    dto: UpdateProcurementGoodsReceiptDto,
  ) {
    return this.success(
      await this.service.update(
        id,
        dto,
      ),
    );
  }

  @RequirePermission(
    PROCUREMENT_PERMISSIONS.GOODS_RECEIPT,
  )
  @Post(':id/post')
  async postReceipt(
    @Param('id')
    id: string,

    @Body()
    dto: PostProcurementGoodsReceiptDto,
  ) {
    return this.success(
      await this.service.post(
        id,
        dto,
      ),
    );
  }

  @RequirePermission(
    PROCUREMENT_PERMISSIONS.MANAGE,
  )
  @Post(':id/reverse')
  async reverse(
    @Param('id')
    id: string,

    @Body()
    dto: ReverseProcurementGoodsReceiptDto,
  ) {
    return this.success(
      await this.service.reverse(
        id,
        dto,
      ),
    );
  }

  private success<T>(
    data: T,
  ) {
    return {
      success: true,
      data,
    };
  }
}
