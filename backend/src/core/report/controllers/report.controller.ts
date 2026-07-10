import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Controller, Get, Query, UseGuards } from '@nestjs/common';

import { Permissions } from '../../auth/constants/permissions';
import { RequirePermission } from '../../auth/decorators/require-permission.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permission.guard';
import { RentCollectionQueryDto } from '../dto/rent-collection-query.dto';
import { ReportService } from '../services/report.service';

@ApiTags('Reports')
@ApiBearerAuth('JWT')
@Controller('reports')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('rent-collection')
  @RequirePermission(Permissions.REPORT_READ)
  async getRentCollection(
    @Query() query: RentCollectionQueryDto,
  ) {
    return {
      success: true,
      data: await this.reportService.getRentCollection(query),
    };
  }
}
