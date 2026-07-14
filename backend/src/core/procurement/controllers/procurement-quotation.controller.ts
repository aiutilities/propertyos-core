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
  CreateProcurementQuotationDto,
} from '../dto/create-procurement-quotation.dto';

import {
  TransitionProcurementQuotationDto,
} from '../dto/transition-procurement-quotation.dto';

import {
  UpdateProcurementQuotationDto,
} from '../dto/update-procurement-quotation.dto';

import {
  PROCUREMENT_PERMISSIONS,
} from '../procurement.constants';

import {
  ProcurementQuotationService,
} from '../services/procurement-quotation.service';

import {
  QuotationStatus,
} from '../types/procurement.types';

@ApiTags('Procurement Quotations')
@ApiBearerAuth('JWT')
@Controller('/procurement/quotations')
@UseGuards(
  JwtAuthGuard,
  PermissionGuard,
)
export class ProcurementQuotationController {
  constructor(
    private readonly service:
      ProcurementQuotationService,
  ) {}

  @RequirePermission(
    PROCUREMENT_PERMISSIONS.READ,
  )
  @Get()
  async list(
    @Query('rfqId')
    rfqId?: string,

    @Query('vendorId')
    vendorId?: string,

    @Query('propertyId')
    propertyId?: string,

    @Query('status')
    status?: QuotationStatus,

    @Query('search')
    search?: string,
  ) {
    return this.success(
      await this.service.list({
        rfqId,
        vendorId,
        propertyId,
        status,
        search,
      }),
    );
  }

  @RequirePermission(
    PROCUREMENT_PERMISSIONS.QUOTATION,
  )
  @Post()
  async create(
    @Body()
    dto: CreateProcurementQuotationDto,
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
      await this.service.get(id),
    );
  }

  @RequirePermission(
    PROCUREMENT_PERMISSIONS.QUOTATION,
  )
  @Patch(':id')
  async update(
    @Param('id')
    id: string,

    @Body()
    dto: UpdateProcurementQuotationDto,
  ) {
    return this.success(
      await this.service.update(
        id,
        dto,
      ),
    );
  }

  @RequirePermission(
    PROCUREMENT_PERMISSIONS.QUOTATION,
  )
  @Post(':id/submit')
  async submit(
    @Param('id')
    id: string,

    @Body()
    dto: TransitionProcurementQuotationDto,
  ) {
    return this.success(
      await this.service.submit(
        id,
        dto,
      ),
    );
  }

  @RequirePermission(
    PROCUREMENT_PERMISSIONS.APPROVE,
  )
  @Post(':id/select')
  async select(
    @Param('id')
    id: string,

    @Body()
    dto: TransitionProcurementQuotationDto,
  ) {
    return this.success(
      await this.service.select(
        id,
        dto,
      ),
    );
  }

  @RequirePermission(
    PROCUREMENT_PERMISSIONS.APPROVE,
  )
  @Post(':id/reject')
  async reject(
    @Param('id')
    id: string,

    @Body()
    dto: TransitionProcurementQuotationDto,
  ) {
    return this.success(
      await this.service.reject(
        id,
        dto,
      ),
    );
  }

  @RequirePermission(
    PROCUREMENT_PERMISSIONS.QUOTATION,
  )
  @Post(':id/withdraw')
  async withdraw(
    @Param('id')
    id: string,

    @Body()
    dto: TransitionProcurementQuotationDto,
  ) {
    return this.success(
      await this.service.withdraw(
        id,
        dto,
      ),
    );
  }

  @RequirePermission(
    PROCUREMENT_PERMISSIONS.MANAGE,
  )
  @Post(':id/expire')
  async expire(
    @Param('id')
    id: string,

    @Body()
    dto: TransitionProcurementQuotationDto,
  ) {
    return this.success(
      await this.service.expire(
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
