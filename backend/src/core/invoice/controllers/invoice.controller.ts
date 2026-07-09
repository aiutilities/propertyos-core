import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permission.guard';
import { RequirePermission } from '../../auth/decorators/require-permission.decorator';
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
  async findAll() {
    const invoices = await this.invoiceService.findAll();

    return {
      success: true,
      data: { invoices },
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
