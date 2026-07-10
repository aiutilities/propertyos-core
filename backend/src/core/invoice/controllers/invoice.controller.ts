import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { RequirePermission } from '../../auth/decorators/require-permission.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permission.guard';
import { PaginationQueryDto } from '../../platform';
import { CreateInvoiceDto } from '../dto/create-invoice.dto';
import { InvoiceService } from '../services/invoice.service';

@ApiTags('Invoices')
@ApiBearerAuth('JWT')
@Controller('invoices')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Post()
  @RequirePermission('invoice.create')
  async create(@Body() body: CreateInvoiceDto) {
    const invoice = await this.invoiceService.create(body);

    return {
      success: true,
      data: { invoice },
    };
  }

  @Get()
  @RequirePermission('invoice.read')
  async findAll(@Query() query: PaginationQueryDto) {
    return {
      success: true,
      data: await this.invoiceService.listPaginated(query),
    };
  }

  @Get(':id')
  @RequirePermission('invoice.read')
  async findById(@Param('id') id: string) {
    const invoice = await this.invoiceService.findById(id);

    return {
      success: true,
      data: { invoice },
    };
  }
}
