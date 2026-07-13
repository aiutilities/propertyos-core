import {
  ApiBearerAuth,
  ApiTags,
} from '@nestjs/swagger';

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
  RequirePermission,
} from '../../auth/decorators/require-permission.decorator';

import {
  JwtAuthGuard,
} from '../../auth/guards/jwt-auth.guard';

import {
  PermissionGuard,
} from '../../auth/guards/permission.guard';

import {
  CreateVendorDto,
} from '../dto/create-vendor.dto';

import {
  UpdateVendorDto,
} from '../dto/update-vendor.dto';

import {
  VendorService,
} from '../services/vendor.service';

import {
  VENDOR_PERMISSIONS,
} from '../vendor.constants';

import {
  VendorStatus,
  VendorType,
} from '../types/vendor.types';

@ApiTags('Vendors')
@ApiBearerAuth('JWT')
@UseGuards(
  JwtAuthGuard,
  PermissionGuard,
)
@Controller('/vendors')
export class VendorController {
  constructor(
    private readonly service:
      VendorService,
  ) {}

  @RequirePermission(
    VENDOR_PERMISSIONS.CREATE,
  )
  @Post()
  async create(
    @Body()
    dto: CreateVendorDto,
  ) {
    return this.success(
      await this.service.create(
        dto,
      ),
    );
  }

  @RequirePermission(
    VENDOR_PERMISSIONS.READ,
  )
  @Get()
  async list(
    @Query('status')
    status?: VendorStatus,

    @Query('vendorType')
    vendorType?: VendorType,

    @Query('categoryId')
    categoryId?: string,

    @Query('propertyId')
    propertyId?: string,

    @Query('search')
    search?: string,
  ) {
    return this.success(
      await this.service.list({
        status,
        vendorType,
        categoryId,
        propertyId,
        search,
      }),
    );
  }

  @RequirePermission(
    VENDOR_PERMISSIONS.READ,
  )
  @Get('categories')
  async categories() {
    return this.success(
      await this.service
        .listCategories(),
    );
  }

  @RequirePermission(
    VENDOR_PERMISSIONS.READ,
  )
  @Get('metrics')
  async metrics() {
    return this.success(
      await this.service
        .getMetrics(),
    );
  }

  @RequirePermission(
    VENDOR_PERMISSIONS.READ,
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
    VENDOR_PERMISSIONS.UPDATE,
  )
  @Patch(':id')
  async update(
    @Param('id')
    id: string,

    @Body()
    dto: UpdateVendorDto,
  ) {
    return this.success(
      await this.service.update(
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
