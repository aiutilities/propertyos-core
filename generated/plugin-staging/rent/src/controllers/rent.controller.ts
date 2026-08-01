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

import { RequirePermission } from '@propertyos/core-contracts';
import { JwtAuthGuard } from '@propertyos/core-contracts';
import { PermissionGuard } from '@propertyos/core-contracts';
import { PaginationQueryDto } from '@propertyos/core-contracts';
import { CreateRentLedgerDto } from '../dto/create-rent-ledger.dto';
import { PostPaymentDto } from '../dto/post-payment.dto';
import { RentService } from '../services/rent.service';

@ApiTags('Rent')
@ApiBearerAuth('JWT')
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
  async listRentLedgers(@Query() query: PaginationQueryDto) {
    const ledgers = await this.rentService.listRentLedgersPaginated(query);

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
