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
  CreatePurchaseRequestDto,
} from '../dto/create-purchase-request.dto';

import {
  RejectPurchaseRequestDto,
} from '../dto/reject-purchase-request.dto';

import {
  TransitionPurchaseRequestDto,
} from '../dto/transition-purchase-request.dto';

import {
  UpdatePurchaseRequestDto,
} from '../dto/update-purchase-request.dto';

import {
  PROCUREMENT_PERMISSIONS,
} from '../procurement.constants';

import {
  PurchaseRequestService,
} from '../services/purchase-request.service';

import {
  PurchaseRequestStatus,
} from '../types/procurement.types';

@ApiTags('Procurement')
@ApiBearerAuth('JWT')
@Controller('/procurement')
@UseGuards(
  JwtAuthGuard,
  PermissionGuard,
)
export class PurchaseRequestController {
  constructor(
    private readonly service:
      PurchaseRequestService,
  ) {}

  @RequirePermission(
    PROCUREMENT_PERMISSIONS.READ,
  )
  @Get('categories')
  async categories() {
    return this.success(
      await this.service.categories(),
    );
  }

  @RequirePermission(
    PROCUREMENT_PERMISSIONS.READ,
  )
  @Get('metrics')
  async metrics() {
    return this.success(
      await this.service.metrics(),
    );
  }

  @RequirePermission(
    PROCUREMENT_PERMISSIONS.READ,
  )
  @Get('requests')
  async list(
    @Query('propertyId')
    propertyId?: string,

    @Query('categoryId')
    categoryId?: string,

    @Query('requestedByPersonId')
    requestedByPersonId?: string,

    @Query('status')
    status?: PurchaseRequestStatus,

    @Query('search')
    search?: string,
  ) {
    return this.success(
      await this.service.list({
        propertyId,
        categoryId,
        requestedByPersonId,
        status,
        search,
      }),
    );
  }

  @RequirePermission(
    PROCUREMENT_PERMISSIONS.CREATE,
  )
  @Post('requests')
  async create(
    @Body()
    dto: CreatePurchaseRequestDto,
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
  @Get('requests/:id')
  async get(
    @Param('id')
    id: string,
  ) {
    return this.success(
      await this.service.get(id),
    );
  }

  @RequirePermission(
    PROCUREMENT_PERMISSIONS.UPDATE,
  )
  @Patch('requests/:id')
  async update(
    @Param('id')
    id: string,

    @Body()
    dto: UpdatePurchaseRequestDto,
  ) {
    return this.success(
      await this.service.update(
        id,
        dto,
      ),
    );
  }

  @RequirePermission(
    PROCUREMENT_PERMISSIONS.CREATE,
  )
  @Post('requests/:id/submit')
  async submit(
    @Param('id')
    id: string,

    @Body()
    dto: TransitionPurchaseRequestDto,
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
  @Post('requests/:id/approve')
  async approve(
    @Param('id')
    id: string,

    @Body()
    dto: TransitionPurchaseRequestDto,
  ) {
    return this.success(
      await this.service.approve(
        id,
        dto,
      ),
    );
  }

  @RequirePermission(
    PROCUREMENT_PERMISSIONS.APPROVE,
  )
  @Post('requests/:id/reject')
  async reject(
    @Param('id')
    id: string,

    @Body()
    dto: RejectPurchaseRequestDto,
  ) {
    return this.success(
      await this.service.reject(
        id,
        dto,
      ),
    );
  }

  @RequirePermission(
    PROCUREMENT_PERMISSIONS.MANAGE,
  )
  @Post('requests/:id/cancel')
  async cancel(
    @Param('id')
    id: string,

    @Body()
    dto: TransitionPurchaseRequestDto,
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
  @Post('requests/:id/close')
  async close(
    @Param('id')
    id: string,

    @Body()
    dto: TransitionPurchaseRequestDto,
  ) {
    return this.success(
      await this.service.close(
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
