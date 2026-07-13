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

import { RequirePermission } from '../../auth/decorators/require-permission.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permission.guard';
import { CreateVehicleDto } from '../dto/create-vehicle.dto';
import {
  RecordVehicleMovementDto,
} from '../dto/record-vehicle-movement.dto';
import {
  UpdateVehicleStatusDto,
} from '../dto/update-vehicle-status.dto';
import { UpdateVehicleDto } from '../dto/update-vehicle.dto';
import { VehicleService } from '../services/vehicle.service';
import {
  VehicleStatus,
  VehicleType,
} from '../types/vehicle.types';
import {
  VEHICLE_PERMISSIONS,
} from '../vehicle.constants';

@ApiTags('Vehicles')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('/vehicles')
export class VehicleController {
  constructor(
    private readonly vehicleService:
      VehicleService,
  ) {}

  @RequirePermission(
    VEHICLE_PERMISSIONS.READ,
  )
  @Get()
  async list(
    @Query('propertyId') propertyId?: string,
    @Query('spaceId') spaceId?: string,
    @Query('ownerPersonId')
    ownerPersonId?: string,
    @Query('vehicleType')
    vehicleType?: VehicleType,
    @Query('status') status?: VehicleStatus,
    @Query('registrationNumber')
    registrationNumber?: string,
    @Query('search') search?: string,
  ) {
    return this.success(
      await this.vehicleService.list({
        propertyId,
        spaceId,
        ownerPersonId,
        vehicleType,
        status,
        registrationNumber,
        search,
      }),
    );
  }

  @RequirePermission(
    VEHICLE_PERMISSIONS.CREATE,
  )
  @Post()
  async create(
    @Body() dto: CreateVehicleDto,
  ) {
    return this.success(
      await this.vehicleService.create(dto),
    );
  }

  @RequirePermission(
    VEHICLE_PERMISSIONS.READ,
  )
  @Get('metrics')
  async metrics(
    @Query('propertyId') propertyId?: string,
  ) {
    return this.success(
      await this.vehicleService.getMetrics(
        propertyId,
      ),
    );
  }

  @RequirePermission(
    VEHICLE_PERMISSIONS.SECURITY,
  )
  @Get('lookup/:registrationNumber')
  async lookup(
    @Param('registrationNumber')
    registrationNumber: string,
  ) {
    return this.success(
      await this.vehicleService
        .lookupByRegistration(
          registrationNumber,
        ),
    );
  }

  @RequirePermission(
    VEHICLE_PERMISSIONS.READ,
  )
  @Get(':id')
  async get(@Param('id') id: string) {
    return this.success(
      await this.vehicleService.get(id),
    );
  }

  @RequirePermission(
    VEHICLE_PERMISSIONS.MANAGE,
  )
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateVehicleDto,
  ) {
    return this.success(
      await this.vehicleService.update(
        id,
        dto,
      ),
    );
  }

  @RequirePermission(
    VEHICLE_PERMISSIONS.MANAGE,
  )
  @Post(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateVehicleStatusDto,
  ) {
    return this.success(
      await this.vehicleService.updateStatus(
        id,
        dto,
      ),
    );
  }

  @RequirePermission(
    VEHICLE_PERMISSIONS.SECURITY,
  )
  @Post(':id/movements')
  async recordMovement(
    @Param('id') id: string,
    @Body() dto: RecordVehicleMovementDto,
  ) {
    return this.success(
      await this.vehicleService.recordMovement(
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
