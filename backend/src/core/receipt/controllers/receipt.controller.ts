import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Permissions } from '../../auth/constants/permissions';
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
  @RequirePermission(Permissions.RECEIPT_CREATE)
  async create(@Body() dto: CreateReceiptDto) {
    return this.receiptService.create(dto);
  }

  @Get()
  @RequirePermission(Permissions.RECEIPT_READ)
  async findAll() {
    return this.receiptService.findAll();
  }

  @Get(':id')
  @RequirePermission(Permissions.RECEIPT_READ)
  async findById(@Param('id') id: string) {
    return this.receiptService.findById(id);
  }
}
