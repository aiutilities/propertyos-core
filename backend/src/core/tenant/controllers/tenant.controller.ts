import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';

import { Permissions } from '../../auth/constants/permissions';
import { RequirePermission } from '../../auth/decorators/require-permission.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permission.guard';
import { PaginationQueryDto } from '../../platform';
import { AssignSpaceDto } from '../dto/assign-space.dto';
import { CreateTenantDto } from '../dto/create-tenant.dto';
import { TenantService } from '../services/tenant.service';

@Controller('/tenants')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @RequirePermission(Permissions.TENANT_CREATE)
  @Post()
  async createTenant(@Body() dto: CreateTenantDto) {
    return this.success(
      await this.tenantService.createTenant({
        personId: dto.personId,
        propertyId: dto.propertyId,
        tenantNumber: dto.tenantNumber,
        status: dto.status ?? 'ACTIVE',
        moveInDate: dto.moveInDate ? new Date(dto.moveInDate) : undefined,
        moveOutDate: dto.moveOutDate ? new Date(dto.moveOutDate) : undefined,
      }),
    );
  }

  @RequirePermission(Permissions.TENANT_READ)
  @Get()
  async listTenants(@Query() query: PaginationQueryDto) {
    return this.success(await this.tenantService.listTenantsPaginated(query));
  }

  @RequirePermission(Permissions.TENANT_READ)
  @Get('/:id')
  async getTenant(@Param('id') id: string) {
    return this.success(await this.tenantService.getTenant(id));
  }

  @RequirePermission(Permissions.TENANT_CREATE)
  @Post('/:tenantId/assign-space')
  async assignSpace(
    @Param('tenantId') tenantId: string,
    @Body() dto: AssignSpaceDto,
  ) {
    return this.success(
      await this.tenantService.assignSpace(tenantId, dto.spaceId),
    );
  }

  @RequirePermission(Permissions.TENANT_READ)
  @Get('/:tenantId/spaces')
  async listTenantSpaces(@Param('tenantId') tenantId: string) {
    return this.success(await this.tenantService.listTenantSpaces(tenantId));
  }

  private success(data: unknown) {
    return {
      success: true,
      data,
    };
  }
}
