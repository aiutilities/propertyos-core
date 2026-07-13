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

import { Permissions } from '../../auth/constants/permissions';
import { RequirePermission } from '../../auth/decorators/require-permission.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permission.guard';

import {
  MAINTENANCE_PERMISSIONS,
} from '../maintenance.constants';

import { AssignMaintenanceTicketDto } from '../dto/assign-maintenance-ticket.dto';
import { CreateMaintenanceTicketDto } from '../dto/create-maintenance-ticket.dto';
import { TransitionMaintenanceTicketDto } from '../dto/transition-maintenance-ticket.dto';
import { UpdateMaintenanceTicketDto } from '../dto/update-maintenance-ticket.dto';
import { MaintenanceService } from '../services/maintenance.service';
import {
  MaintenancePriority,
  MaintenanceStatus,
} from '../types/maintenance.types';

@ApiTags('Maintenance')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('/maintenance')
export class MaintenanceController {
  constructor(
    private readonly maintenanceService: MaintenanceService,
  ) {}

  @RequirePermission(MAINTENANCE_PERMISSIONS.CREATE)
  @Post()
  async create(@Body() dto: CreateMaintenanceTicketDto) {
    return this.success(
      await this.maintenanceService.create(dto),
    );
  }

  @RequirePermission(MAINTENANCE_PERMISSIONS.READ)
  @Get()
  async list(
    @Query('propertyId') propertyId?: string,
    @Query('spaceId') spaceId?: string,
    @Query('reporterPersonId') reporterPersonId?: string,
    @Query('assigneePersonId') assigneePersonId?: string,
    @Query('categoryId') categoryId?: string,
    @Query('priority') priority?: MaintenancePriority,
    @Query('status') status?: MaintenanceStatus,
    @Query('search') search?: string,
  ) {
    return this.success(
      await this.maintenanceService.list({
        propertyId,
        spaceId,
        reporterPersonId,
        assigneePersonId,
        categoryId,
        priority,
        status,
        search,
      }),
    );
  }

  @RequirePermission(MAINTENANCE_PERMISSIONS.READ)
  @Get('categories')
  async listCategories() {
    return this.success(
      await this.maintenanceService.listCategories(),
    );
  }

  @RequirePermission(MAINTENANCE_PERMISSIONS.READ)
  @Get('metrics')
  async getMetrics(
    @Query('propertyId') propertyId?: string,
  ) {
    return this.success(
      await this.maintenanceService.getMetrics(propertyId),
    );
  }

  @RequirePermission(MAINTENANCE_PERMISSIONS.READ)
  @Get(':id')
  async get(@Param('id') id: string) {
    return this.success(
      await this.maintenanceService.get(id),
    );
  }

  @RequirePermission(MAINTENANCE_PERMISSIONS.MANAGE)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateMaintenanceTicketDto,
  ) {
    return this.success(
      await this.maintenanceService.update(id, dto),
    );
  }

  @RequirePermission(MAINTENANCE_PERMISSIONS.MANAGE)
  @Post(':id/assign')
  async assign(
    @Param('id') id: string,
    @Body() dto: AssignMaintenanceTicketDto,
  ) {
    return this.success(
      await this.maintenanceService.assign(id, dto),
    );
  }

  @RequirePermission(MAINTENANCE_PERMISSIONS.MANAGE)
  @Post(':id/transition')
  async transition(
    @Param('id') id: string,
    @Body() dto: TransitionMaintenanceTicketDto,
  ) {
    return this.success(
      await this.maintenanceService.transition(id, dto),
    );
  }

  @RequirePermission(MAINTENANCE_PERMISSIONS.READ)
  @Get(':id/history')
  async history(@Param('id') id: string) {
    return this.success(
      await this.maintenanceService.getHistory(id),
    );
  }

  private success(data: unknown) {
    return {
      success: true,
      data,
    };
  }
}
