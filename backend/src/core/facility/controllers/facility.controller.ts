import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
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

import { RequirePermission } from '../../auth/decorators/require-permission.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permission.guard';
import {
  FACILITY_PERMISSIONS,
} from '../facility.constants';
import { CreateAssetCategoryDto } from '../dto/create-asset-category.dto';
import { CreateAssetDto } from '../dto/create-asset.dto';
import { CreatePreventiveMaintenancePlanDto } from '../dto/create-preventive-maintenance-plan.dto';
import { TransitionAssetDto } from '../dto/transition-asset.dto';
import { UpdateAssetDto } from '../dto/update-asset.dto';
import { FacilityService } from '../services/facility.service';
import {
  AssetCondition,
  AssetStatus,
} from '../types/facility.types';

@ApiTags('Facilities')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('/facilities')
export class FacilityController {
  constructor(
    private readonly facilityService: FacilityService,
  ) {}

  @RequirePermission(FACILITY_PERMISSIONS.READ)
  @Get('categories')
  async listCategories() {
    return this.success(
      await this.facilityService.listCategories(),
    );
  }

  @RequirePermission(FACILITY_PERMISSIONS.MANAGE)
  @Post('categories')
  async createCategory(
    @Body() dto: CreateAssetCategoryDto,
  ) {
    return this.success(
      await this.facilityService.createCategory(dto),
    );
  }

  @RequirePermission(FACILITY_PERMISSIONS.READ)
  @Get('assets')
  async listAssets(
    @Query('propertyId') propertyId?: string,
    @Query('zoneId') zoneId?: string,
    @Query('spaceId') spaceId?: string,
    @Query('categoryId') categoryId?: string,
    @Query('status') status?: AssetStatus,
    @Query('condition') condition?: AssetCondition,
    @Query('search') search?: string,
  ) {
    return this.success(
      await this.facilityService.listAssets({
        propertyId,
        zoneId,
        spaceId,
        categoryId,
        status,
        condition,
        search,
      }),
    );
  }

  @RequirePermission(FACILITY_PERMISSIONS.CREATE)
  @Post('assets')
  async createAsset(
    @Body() dto: CreateAssetDto,
  ) {
    return this.success(
      await this.facilityService.createAsset(dto),
    );
  }

  @RequirePermission(FACILITY_PERMISSIONS.READ)
  @Get('assets/metrics')
  async getMetrics(
    @Query('propertyId') propertyId?: string,
  ) {
    return this.success(
      await this.facilityService.getMetrics(propertyId),
    );
  }

  @RequirePermission(FACILITY_PERMISSIONS.READ)
  @Get('assets/:id')
  async getAsset(@Param('id') id: string) {
    return this.success(
      await this.facilityService.getAsset(id),
    );
  }

  @RequirePermission(FACILITY_PERMISSIONS.MANAGE)
  @Patch('assets/:id')
  async updateAsset(
    @Param('id') id: string,
    @Body() dto: UpdateAssetDto,
  ) {
    return this.success(
      await this.facilityService.updateAsset(id, dto),
    );
  }

  @RequirePermission(FACILITY_PERMISSIONS.MANAGE)
  @Post('assets/:id/transition')
  async transitionAsset(
    @Param('id') id: string,
    @Body() dto: TransitionAssetDto,
  ) {
    return this.success(
      await this.facilityService.transitionAsset(
        id,
        dto,
      ),
    );
  }

  @RequirePermission(FACILITY_PERMISSIONS.MANAGE)
  @Post('assets/:id/preventive-plans')
  async createPreventivePlan(
    @Param('id') id: string,
    @Body() dto: CreatePreventiveMaintenancePlanDto,
  ) {
    return this.success(
      await this.facilityService.createPreventivePlan(
        id,
        dto,
      ),
    );
  }

  private success(data: unknown) {
    return {
      success: true,
      data,
    };
  }
}
