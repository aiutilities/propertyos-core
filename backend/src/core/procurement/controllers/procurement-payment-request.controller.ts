import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
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
  IdempotentOperation,
} from '../../platform/idempotency/decorators/idempotent-operation.decorator';
import {
  PlatformIdempotencyInterceptor,
} from '../../platform/idempotency/http/platform-idempotency.interceptor';

import {
  ApproveProcurementPaymentRequestDto,
} from '../dto/approve-procurement-payment-request.dto';

import {
  CancelProcurementPaymentRequestDto,
} from '../dto/cancel-procurement-payment-request.dto';

import {
  CreateProcurementPaymentRequestDto,
} from '../dto/create-procurement-payment-request.dto';

import {
  PayProcurementPaymentRequestDto,
} from '../dto/pay-procurement-payment-request.dto';

import {
  RejectProcurementPaymentRequestDto,
} from '../dto/reject-procurement-payment-request.dto';

import {
  SubmitProcurementPaymentRequestDto,
} from '../dto/submit-procurement-payment-request.dto';

import {
  UpdateProcurementPaymentRequestDto,
} from '../dto/update-procurement-payment-request.dto';

import {
  PROCUREMENT_PERMISSIONS,
} from '../procurement.constants';

import {
  ProcurementPaymentRequestService,
} from '../services/procurement-payment-request.service';

import {
  PaymentRequestStatus,
} from '../types/procurement.types';

@ApiTags('Procurement Payment Requests')
@ApiBearerAuth('JWT')
@Controller('/procurement/payment-requests')
@UseGuards(
  JwtAuthGuard,
  PermissionGuard,
)
export class ProcurementPaymentRequestController {
  constructor(
    private readonly service:
      ProcurementPaymentRequestService,
  ) {}

  @RequirePermission(
    PROCUREMENT_PERMISSIONS.READ,
  )
  @Get()
  async list(
    @Query('invoiceMatchId')
    invoiceMatchId?: string,

    @Query('purchaseOrderId')
    purchaseOrderId?: string,

    @Query('vendorId')
    vendorId?: string,

    @Query('propertyId')
    propertyId?: string,

    @Query('status')
    status?: PaymentRequestStatus,

    @Query('overdue')
    overdue?: string,

    @Query('search')
    search?: string,
  ) {
    return this.success(
      await this.service.list({
        invoiceMatchId,
        purchaseOrderId,
        vendorId,
        propertyId,
        status,
        overdue:
          overdue === 'true',
        search,
      }),
    );
  }

  @RequirePermission(
    PROCUREMENT_PERMISSIONS.PAYMENT_REQUEST,
  )
  @Post()
  async create(
    @Body()
    dto: CreateProcurementPaymentRequestDto,
  ) {
    return this.success(
      await this.service.create(
        dto,
      ),
    );
  }

  @RequirePermission(
    PROCUREMENT_PERMISSIONS.READ,
  )
  @Get(':id')
  async get(
    @Param('id')
    id: string,
  ) {
    return this.success(
      await this.service.get(
        id,
      ),
    );
  }

  @RequirePermission(
    PROCUREMENT_PERMISSIONS.PAYMENT_REQUEST,
  )
  @Patch(':id')
  async update(
    @Param('id')
    id: string,

    @Body()
    dto: UpdateProcurementPaymentRequestDto,
  ) {
    return this.success(
      await this.service.update(
        id,
        dto,
      ),
    );
  }

  @RequirePermission(
    PROCUREMENT_PERMISSIONS.PAYMENT_REQUEST,
  )
  @Post(':id/submit')
  async submit(
    @Param('id')
    id: string,

    @Body()
    dto: SubmitProcurementPaymentRequestDto,
  ) {
    return this.success(
      await this.service.submit(
        id,
        dto,
      ),
    );
  }

  @RequirePermission(
    PROCUREMENT_PERMISSIONS.APPROVE,
  )
  @Post(':id/approve')
  async approve(
    @Param('id')
    id: string,

    @Body()
    dto: ApproveProcurementPaymentRequestDto,
  ) {
    return this.success(
      await this.service.approve(
        id,
        dto,
      ),
    );
  }

  @RequirePermission(
    PROCUREMENT_PERMISSIONS.APPROVE,
  )
  @Post(':id/reject')
  async reject(
    @Param('id')
    id: string,

    @Body()
    dto: RejectProcurementPaymentRequestDto,
  ) {
    return this.success(
      await this.service.reject(
        id,
        dto,
      ),
    );
  }

  @RequirePermission(
    PROCUREMENT_PERMISSIONS.MANAGE,
  )
  @Post(':id/cancel')
  async cancel(
    @Param('id')
    id: string,

    @Body()
    dto: CancelProcurementPaymentRequestDto,
  ) {
    return this.success(
      await this.service.cancel(
        id,
        dto,
      ),
    );
  }

  @RequirePermission(
    PROCUREMENT_PERMISSIONS.MANAGE,
  )
  @UseInterceptors(
    PlatformIdempotencyInterceptor,
  )
  @IdempotentOperation({
    operation:
      'procurement.payment-request.pay',
    required:
      true,
    expiresInSeconds:
      24 * 60 * 60,
    resource:
      (request) =>
        `procurement-payment-request:${request.params.id}`,
  })
  @Post(':id/pay')
  async pay(
    @Param('id')
    id: string,

    @Body()
    dto: PayProcurementPaymentRequestDto,
  ) {
    return this.success(
      await this.service.pay(
        id,
        dto,
      ),
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
