import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  Controller,
  Get,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';

import { Permissions } from '@propertyos/core-contracts';
import { RequirePermission } from '@propertyos/core-contracts';
import { JwtAuthGuard } from '@propertyos/core-contracts';
import { PermissionGuard } from '@propertyos/core-contracts';
import { OutstandingRentQueryDto } from '../dto/outstanding-rent-query.dto';
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

  @Get('rent-collection/export.csv')
  @RequirePermission(Permissions.REPORT_READ)
  async exportRentCollectionCsv(
    @Query() query: RentCollectionQueryDto,
    @Res() response: Response,
  ): Promise<void> {
    const file =
      await this.reportService.exportRentCollectionCsv(query);

    response.setHeader('Content-Type', file.contentType);
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="${file.filename}"`,
    );
    response.status(200).send(file.content);
  }

  @Get('rent-collection/export.pdf')
  @RequirePermission(Permissions.REPORT_READ)
  async exportRentCollectionPdf(
    @Query() query: RentCollectionQueryDto,
    @Res() response: Response,
  ): Promise<void> {
    const file =
      await this.reportService.exportRentCollectionPdf(query);

    response.setHeader('Content-Type', file.contentType);
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="${file.filename}"`,
    );
    response.status(200).send(file.content);
  }

  @Get('outstanding-rent')
  @RequirePermission(Permissions.REPORT_READ)
  async getOutstandingRent(
    @Query() query: OutstandingRentQueryDto,
  ) {
    return {
      success: true,
      data: await this.reportService.getOutstandingRent(query),
    };
  }

  @Get('outstanding-rent/export.csv')
  @RequirePermission(Permissions.REPORT_READ)
  async exportOutstandingRentCsv(
    @Query() query: OutstandingRentQueryDto,
    @Res() response: Response,
  ): Promise<void> {
    const file =
      await this.reportService.exportOutstandingRentCsv(query);

    response.setHeader('Content-Type', file.contentType);
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="${file.filename}"`,
    );
    response.status(200).send(file.content);
  }


  @Get('outstanding-rent/export.pdf')
  @RequirePermission(Permissions.REPORT_READ)
  async exportOutstandingRentPdf(
    @Query() query: OutstandingRentQueryDto,
    @Res() response: Response,
  ): Promise<void> {
    const file =
      await this.reportService.exportOutstandingRentPdf(query);

    response.setHeader('Content-Type', file.contentType);
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="${file.filename}"`,
    );
    response.status(200).send(file.content);
  }
}
