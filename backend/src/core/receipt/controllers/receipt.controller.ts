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

import { Permissions } from '../../auth/constants/permissions';
import { RequirePermission } from '../../auth/decorators/require-permission.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permission.guard';
import { PaginationQueryDto } from '../../platform';
import { CreateReceiptDto } from '../dto/create-receipt.dto';
import { ReceiptService } from '../services/receipt.service';

@ApiTags('Receipts')
@ApiBearerAuth('JWT')
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
  async findAll(@Query() query: PaginationQueryDto) {
    return {
      success: true,
      data: await this.receiptService.listPaginated(query),
    };
  }

  @Get(':id')
  @RequirePermission(Permissions.RECEIPT_READ)
  async findById(@Param('id') id: string) {
    return this.receiptService.findById(id);
  }
}
