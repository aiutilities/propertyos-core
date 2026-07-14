import {
  Controller,
  Get,
  Param,
  UseGuards,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiTags,
} from '@nestjs/swagger';

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
  PROCUREMENT_PERMISSIONS,
} from '../procurement.constants';

import {
  ProcurementQuotationComparisonService,
} from '../services/procurement-quotation-comparison.service';

@ApiTags(
  'Procurement Quotation Comparison',
)
@ApiBearerAuth('JWT')
@Controller('/procurement/rfqs')
@UseGuards(
  JwtAuthGuard,
  PermissionGuard,
)
export class ProcurementQuotationComparisonController {
  constructor(
    private readonly comparisonService:
      ProcurementQuotationComparisonService,
  ) {}

  @RequirePermission(
    PROCUREMENT_PERMISSIONS.QUOTATION,
  )
  @Get(':rfqId/comparison')
  async compare(
    @Param('rfqId')
    rfqId: string,
  ) {
    return this.success(
      await this.comparisonService
        .compare(rfqId),
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
