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
  ApproveProcurementInvoiceMatchDto,
} from '../dto/approve-procurement-invoice-match.dto';

import {
  CompleteProcurementInvoiceMatchDto,
} from '../dto/complete-procurement-invoice-match.dto';

import {
  CreateProcurementInvoiceMatchDto,
} from '../dto/create-procurement-invoice-match.dto';

import {
  RejectProcurementInvoiceMatchDto,
} from '../dto/reject-procurement-invoice-match.dto';

import {
  UpdateProcurementInvoiceMatchDto,
} from '../dto/update-procurement-invoice-match.dto';

import {
  PROCUREMENT_PERMISSIONS,
} from '../procurement.constants';

import {
  ProcurementInvoiceMatchService,
} from '../services/procurement-invoice-match.service';

import {
  InvoiceMatchStatus,
} from '../types/procurement.types';

@ApiTags('Procurement Invoice Match')
@ApiBearerAuth('JWT')
@Controller('/procurement/invoice-matches')
@UseGuards(
  JwtAuthGuard,
  PermissionGuard,
)
export class ProcurementInvoiceMatchController {
  constructor(
    private readonly service:
      ProcurementInvoiceMatchService,
  ) {}

  @RequirePermission(
    PROCUREMENT_PERMISSIONS.READ,
  )
  @Get()
  async list(
    @Query('purchaseOrderId')
    purchaseOrderId?: string,

    @Query('goodsReceiptId')
    goodsReceiptId?: string,

    @Query('vendorId')
    vendorId?: string,

    @Query('propertyId')
    propertyId?: string,

    @Query('status')
    status?: InvoiceMatchStatus,

    @Query('search')
    search?: string,
  ) {
    return {
      success: true,
      data: await this.service.list({
        purchaseOrderId,
        goodsReceiptId,
        vendorId,
        propertyId,
        status,
        search,
      }),
    };
  }

  @RequirePermission(
    PROCUREMENT_PERMISSIONS.INVOICE_MATCH,
  )
  @Post()
  async create(
    @Body()
    dto: CreateProcurementInvoiceMatchDto,
  ) {
    return {
      success: true,
      data: await this.service.create(dto),
    };
  }

  @RequirePermission(
    PROCUREMENT_PERMISSIONS.READ,
  )
  @Get(':id')
  async get(
    @Param('id')
    id: string,
  ) {
    return {
      success: true,
      data: await this.service.get(id),
    };
  }

  @RequirePermission(
    PROCUREMENT_PERMISSIONS.INVOICE_MATCH,
  )
  @Patch(':id')
  async update(
    @Param('id')
    id: string,

    @Body()
    dto: UpdateProcurementInvoiceMatchDto,
  ) {
    return {
      success: true,
      data: await this.service.update(
        id,
        dto,
      ),
    };
  }

  @RequirePermission(
    PROCUREMENT_PERMISSIONS.INVOICE_MATCH,
  )
  @Post(':id/complete')
  async complete(
    @Param('id')
    id: string,

    @Body()
    dto: CompleteProcurementInvoiceMatchDto,
  ) {
    return {
      success: true,
      data: await this.service.complete(
        id,
        dto,
      ),
    };
  }

  @RequirePermission(
    PROCUREMENT_PERMISSIONS.APPROVE,
  )
  @Post(':id/approve')
  async approve(
    @Param('id')
    id: string,

    @Body()
    dto: ApproveProcurementInvoiceMatchDto,
  ) {
    return {
      success: true,
      data: await this.service.approve(
        id,
        dto,
      ),
    };
  }

  @RequirePermission(
    PROCUREMENT_PERMISSIONS.APPROVE,
  )
  @Post(':id/reject')
  async reject(
    @Param('id')
    id: string,

    @Body()
    dto: RejectProcurementInvoiceMatchDto,
  ) {
    return {
      success: true,
      data: await this.service.reject(
        id,
        dto,
      ),
    };
  }
}
