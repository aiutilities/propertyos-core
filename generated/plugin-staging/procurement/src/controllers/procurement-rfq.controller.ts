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
  CreateProcurementRfqDto,
} from '../dto/create-procurement-rfq.dto';

import {
  DeclineProcurementRfqDto,
} from '../dto/decline-procurement-rfq.dto';

import {
  TransitionProcurementRfqDto,
} from '../dto/transition-procurement-rfq.dto';

import {
  UpdateProcurementRfqDto,
} from '../dto/update-procurement-rfq.dto';

import {
  PROCUREMENT_PERMISSIONS,
} from '../procurement.constants';

import {
  ProcurementRfqService,
} from '../services/procurement-rfq.service';

import {
  RfqStatus,
} from '../types/procurement.types';

@ApiTags('Procurement RFQ')
@ApiBearerAuth('JWT')
@Controller('/procurement/rfqs')
@UseGuards(
  JwtAuthGuard,
  PermissionGuard,
)
export class ProcurementRfqController {
  constructor(
    private readonly service:
      ProcurementRfqService,
  ) {}

  @RequirePermission(
    PROCUREMENT_PERMISSIONS.READ,
  )
  @Get()
  async list(
    @Query('purchaseRequestId')
    purchaseRequestId?: string,

    @Query('propertyId')
    propertyId?: string,

    @Query('vendorId')
    vendorId?: string,

    @Query('status')
    status?: RfqStatus,

    @Query('search')
    search?: string,
  ) {
    return this.success(
      await this.service.list({
        purchaseRequestId,
        propertyId,
        vendorId,
        status,
        search,
      }),
    );
  }

  @RequirePermission(
    PROCUREMENT_PERMISSIONS.RFQ,
  )
  @Post()
  async create(
    @Body()
    dto: CreateProcurementRfqDto,
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
    PROCUREMENT_PERMISSIONS.RFQ,
  )
  @Patch(':id')
  async update(
    @Param('id')
    id: string,

    @Body()
    dto: UpdateProcurementRfqDto,
  ) {
    return this.success(
      await this.service.update(
        id,
        dto,
      ),
    );
  }

  @RequirePermission(
    PROCUREMENT_PERMISSIONS.RFQ,
  )
  @Post(':id/issue')
  async issue(
    @Param('id')
    id: string,

    @Body()
    dto: TransitionProcurementRfqDto,
  ) {
    return this.success(
      await this.service.issue(
        id,
        dto,
      ),
    );
  }

  @RequirePermission(
    PROCUREMENT_PERMISSIONS.RFQ,
  )
  @Post(':id/close')
  async close(
    @Param('id')
    id: string,

    @Body()
    dto: TransitionProcurementRfqDto,
  ) {
    return this.success(
      await this.service.close(
        id,
        dto,
      ),
    );
  }

  @RequirePermission(
    PROCUREMENT_PERMISSIONS.RFQ,
  )
  @Post(':id/cancel')
  async cancel(
    @Param('id')
    id: string,

    @Body()
    dto: TransitionProcurementRfqDto,
  ) {
    return this.success(
      await this.service.cancel(
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
    dto: TransitionProcurementRfqDto,
  ) {
    return this.success(
      await this.service.expire(
        id,
        dto,
      ),
    );
  }

  @RequirePermission(
    PROCUREMENT_PERMISSIONS.RFQ,
  )
  @Post(':id/vendors/:vendorId/viewed')
  async markVendorViewed(
    @Param('id')
    id: string,

    @Param('vendorId')
    vendorId: string,
  ) {
    return this.success(
      await this.service
        .markVendorViewed(
          id,
          vendorId,
        ),
    );
  }

  @RequirePermission(
    PROCUREMENT_PERMISSIONS.RFQ,
  )
  @Post(':id/vendors/:vendorId/responded')
  async markVendorResponded(
    @Param('id')
    id: string,

    @Param('vendorId')
    vendorId: string,
  ) {
    return this.success(
      await this.service
        .markVendorResponded(
          id,
          vendorId,
        ),
    );
  }

  @RequirePermission(
    PROCUREMENT_PERMISSIONS.RFQ,
  )
  @Post(':id/vendors/decline')
  async declineVendor(
    @Param('id')
    id: string,

    @Body()
    dto: DeclineProcurementRfqDto,
  ) {
    return this.success(
      await this.service.declineVendor(
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
