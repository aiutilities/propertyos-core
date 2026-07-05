import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permission.guard';
import { RequirePermission } from '../../auth/decorators/require-permission.decorator';
import { CreateRentLedgerDto } from '../dto/create-rent-ledger.dto';
import { PostPaymentDto } from '../dto/post-payment.dto';
import { RentService } from '../services/rent.service';

@Controller('rent-ledgers')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class RentController {
  constructor(private readonly rentService: RentService) {}

  @Post()
  @RequirePermission('rent.create')
  async createRentLedger(@Body() body: CreateRentLedgerDto) {
    const ledger = await this.rentService.createRentLedger(body);

    return {
      success: true,
      data: ledger,
    };
  }

  @Get()
  @RequirePermission('rent.read')
  async listRentLedgers() {
    const ledgers = await this.rentService.listRentLedgers();

    return {
      success: true,
      data: ledgers,
    };
  }

  @Get(':id')
  @RequirePermission('rent.read')
  async getRentLedger(@Param('id') id: string) {
    const ledger = await this.rentService.getRentLedger(id);

    return {
      success: true,
      data: ledger,
    };
  }

  @Post(':id/payments')
  @RequirePermission('rent.create')
  async postPayment(
    @Param('id') id: string,
    @Body() body: PostPaymentDto,
  ) {
    const result = await this.rentService.postPayment(id, body);

    return {
      success: true,
      data: result,
    };
  }

  @Get(':id/payments')
  @RequirePermission('rent.read')
  async listPayments(@Param('id') id: string) {
    const payments = await this.rentService.listPayments(id);

    return {
      success: true,
      data: payments,
    };
  }
}
