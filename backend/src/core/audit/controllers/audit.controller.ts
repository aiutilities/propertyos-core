import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Controller, Get, Query, UseGuards } from '@nestjs/common';

import { Permissions } from '../../auth/constants/permissions';
import { RequirePermission } from '../../auth/decorators/require-permission.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permission.guard';
import { AuditService } from '../audit.service';
import { AuditQueryDto } from '../dto/audit-query.dto';

@ApiTags('Audit')
@ApiBearerAuth('JWT')
@Controller('audit')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @RequirePermission(Permissions.AUDIT_READ)
  async list(@Query() query: AuditQueryDto) {
    const logs = await this.auditService.list({
      ...query,
      limit: query.limit ? Number(query.limit) : undefined,
      offset: query.offset ? Number(query.offset) : undefined,
    });

    return {
      success: true,
      data: {
        logs,
      },
    };
  }

  @Get('entity')
  @RequirePermission(Permissions.AUDIT_READ)
  async listByEntity(@Query() query: AuditQueryDto) {
    const logs = await this.auditService.listByEntity(
      query.entityType ?? '',
      query.entityId ?? '',
      query.limit ? Number(query.limit) : 100,
    );

    return {
      success: true,
      data: {
        logs,
      },
    };
  }
}
