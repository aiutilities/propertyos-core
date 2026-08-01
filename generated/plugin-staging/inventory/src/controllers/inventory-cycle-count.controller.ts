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
  CancelCycleCountDto,
  CompleteCycleCountDto,
  CreateCycleCountDto,
  PostCycleCountDto,
  RecordCycleCountDto,
  StartCycleCountDto,
} from '../dto';

import {
  INVENTORY_PERMISSIONS,
} from '../inventory.constants';

import {
  InventoryCycleCountService,
} from '../services/inventory-cycle-count.service';

@ApiTags('Inventory Cycle Counts')
@ApiBearerAuth('JWT')
@UseGuards(
  JwtAuthGuard,
  PermissionGuard,
)
@Controller('/inventory/cycle-counts')
export class InventoryCycleCountController {
  constructor(
    private readonly service:
      InventoryCycleCountService,
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
        .listCycleCounts({
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
        .getCycleCount(id),
    );
  }

  @RequirePermission(
    INVENTORY_PERMISSIONS.COUNT,
  )
  @Post()
  async create(
    @Body()
    dto:
      CreateCycleCountDto,
  ) {
    return this.success(
      await this.service
        .createCycleCount(dto),
    );
  }

  @RequirePermission(
    INVENTORY_PERMISSIONS.COUNT,
  )
  @Post(':id/start')
  async start(
    @Param('id')
    id: string,

    @Body()
    dto:
      StartCycleCountDto,
  ) {
    return this.success(
      await this.service
        .startCycleCount(
          id,
          dto,
        ),
    );
  }

  @RequirePermission(
    INVENTORY_PERMISSIONS.COUNT,
  )
  @Post(':id/record')
  async record(
    @Param('id')
    id: string,

    @Body()
    dto:
      RecordCycleCountDto,
  ) {
    return this.success(
      await this.service
        .recordCount(
          id,
          dto,
        ),
    );
  }

  @RequirePermission(
    INVENTORY_PERMISSIONS.COUNT,
  )
  @Post(':id/complete')
  async complete(
    @Param('id')
    id: string,

    @Body()
    dto:
      CompleteCycleCountDto,
  ) {
    return this.success(
      await this.service
        .completeCycleCount(
          id,
          dto,
        ),
    );
  }

  @RequirePermission(
    INVENTORY_PERMISSIONS.ADJUST,
  )
  @Post(':id/post')
  async postCount(
    @Param('id')
    id: string,

    @Body()
    dto:
      PostCycleCountDto,
  ) {
    return this.success(
      await this.service
        .postCycleCount(
          id,
          dto,
        ),
    );
  }

  @RequirePermission(
    INVENTORY_PERMISSIONS.COUNT,
  )
  @Post(':id/cancel')
  async cancel(
    @Param('id')
    id: string,

    @Body()
    dto:
      CancelCycleCountDto,
  ) {
    return this.success(
      await this.service
        .cancelCycleCount(
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
