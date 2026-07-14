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
} from '../../auth/decorators/require-permission.decorator';

import {
  JwtAuthGuard,
} from '../../auth/guards/jwt-auth.guard';

import {
  PermissionGuard,
} from '../../auth/guards/permission.guard';

import {
  CreateProcurementPurchaseOrderDto,
} from '../dto/create-procurement-purchase-order.dto';

import {
  TransitionProcurementPurchaseOrderDto,
} from '../dto/transition-procurement-purchase-order.dto';

import {
  UpdateProcurementPurchaseOrderDto,
} from '../dto/update-procurement-purchase-order.dto';

import {
  PROCUREMENT_PERMISSIONS,
} from '../procurement.constants';

import {
  ProcurementPurchaseOrderService,
} from '../services/procurement-purchase-order.service';

import {
  PurchaseOrderStatus,
} from '../types/procurement.types';

@ApiTags('Procurement Purchase Orders')
@ApiBearerAuth('JWT')
@Controller('/procurement/purchase-orders')
@UseGuards(
  JwtAuthGuard,
  PermissionGuard,
)
export class ProcurementPurchaseOrderController {
  constructor(
    private readonly service:
      ProcurementPurchaseOrderService,
  ) {}

  @RequirePermission(
    PROCUREMENT_PERMISSIONS.READ,
  )
  @Get()
  async list(
    @Query('quotationId')
    quotationId?: string,

    @Query('rfqId')
    rfqId?: string,

    @Query('purchaseRequestId')
    purchaseRequestId?: string,

    @Query('propertyId')
    propertyId?: string,

    @Query('vendorId')
    vendorId?: string,

    @Query('status')
    status?: PurchaseOrderStatus,

    @Query('search')
    search?: string,
  ) {
    return this.success(
      await this.service.list({
        quotationId,
        rfqId,
        purchaseRequestId,
        propertyId,
        vendorId,
        status,
        search,
      }),
    );
  }

  @RequirePermission(
    PROCUREMENT_PERMISSIONS.PURCHASE_ORDER,
  )
  @Post()
  async create(
    @Body()
    dto: CreateProcurementPurchaseOrderDto,
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
    PROCUREMENT_PERMISSIONS.PURCHASE_ORDER,
  )
  @Patch(':id')
  async update(
    @Param('id')
    id: string,

    @Body()
    dto: UpdateProcurementPurchaseOrderDto,
  ) {
    return this.success(
      await this.service.update(
        id,
        dto,
      ),
    );
  }

  @RequirePermission(
    PROCUREMENT_PERMISSIONS.PURCHASE_ORDER,
  )
  @Post(':id/submit')
  async submitForApproval(
    @Param('id')
    id: string,

    @Body()
    dto: TransitionProcurementPurchaseOrderDto,
  ) {
    return this.success(
      await this.service
        .submitForApproval(
          id,
          dto,
        ),
    );
  }

  @RequirePermission(
    PROCUREMENT_PERMISSIONS.APPROVE,
  )
  @Post(':id/approve')
  async approve(
    @Param('id')
    id: string,

    @Body()
    dto: TransitionProcurementPurchaseOrderDto,
  ) {
    return this.success(
      await this.service.approve(
        id,
        dto,
      ),
    );
  }

  @RequirePermission(
    PROCUREMENT_PERMISSIONS.PURCHASE_ORDER,
  )
  @Post(':id/issue')
  async issue(
    @Param('id')
    id: string,

    @Body()
    dto: TransitionProcurementPurchaseOrderDto,
  ) {
    return this.success(
      await this.service.issue(
        id,
        dto,
      ),
    );
  }

  @RequirePermission(
    PROCUREMENT_PERMISSIONS.PURCHASE_ORDER,
  )
  @Post(':id/acknowledge')
  async acknowledge(
    @Param('id')
    id: string,

    @Body()
    dto: TransitionProcurementPurchaseOrderDto,
  ) {
    return this.success(
      await this.service
        .acknowledge(
          id,
          dto,
        ),
    );
  }

  @RequirePermission(
    PROCUREMENT_PERMISSIONS.PURCHASE_ORDER,
  )
  @Post(':id/received')
  async markReceived(
    @Param('id')
    id: string,

    @Body()
    dto: TransitionProcurementPurchaseOrderDto,
  ) {
    return this.success(
      await this.service
        .markReceived(
          id,
          dto,
        ),
    );
  }

  @RequirePermission(
    PROCUREMENT_PERMISSIONS.MANAGE,
  )
  @Post(':id/close')
  async close(
    @Param('id')
    id: string,

    @Body()
    dto: TransitionProcurementPurchaseOrderDto,
  ) {
    return this.success(
      await this.service.close(
        id,
        dto,
      ),
    );
  }

  @RequirePermission(
    PROCUREMENT_PERMISSIONS.MANAGE,
  )
  @Post(':id/cancel')
  async cancel(
    @Param('id')
    id: string,

    @Body()
    dto: TransitionProcurementPurchaseOrderDto,
  ) {
    return this.success(
      await this.service.cancel(
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
