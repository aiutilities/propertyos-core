import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permission.guard';
import { RequirePermission } from '../../auth/decorators/require-permission.decorator';
import { CreateReceiptDto } from '../dto/create-receipt.dto';
import { ReceiptService } from '../services/receipt.service';

@Controller('receipts')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class ReceiptController {
  constructor(private readonly receiptService: ReceiptService) {}

  @Post()
  @RequirePermission('receipt:create')
  async create(@Body() dto: CreateReceiptDto) {
    return this.receiptService.create(dto);
  }

  @Get()
  @RequirePermission('receipt:read')
  async findAll() {
    return this.receiptService.findAll();
  }

  @Get(':id')
  @RequirePermission('receipt:read')
  async findById(@Param('id') id: string) {
    return this.receiptService.findById(id);
  }
}
