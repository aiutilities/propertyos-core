import {
  ApiBearerAuth,
  ApiTags,
} from '@nestjs/swagger';

import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

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
  CapturePaymentDto,
  CreatePaymentDto,
  ListPaymentsQueryDto,
  RefundPaymentDto,
} from '../dto';

import {
  PAYMENT_PERMISSIONS,
} from '../payment.constants';

import {
  PaymentService,
} from '../services';

@ApiTags(
  'Payments',
)
@ApiBearerAuth(
  'JWT',
)
@UseGuards(
  JwtAuthGuard,
  PermissionGuard,
)
@Controller(
  'payments',
)
export class PaymentController {
  constructor(
    private readonly service:
      PaymentService,
  ) {}

  @Post()
  @RequirePermission(
    PAYMENT_PERMISSIONS.CREATE,
  )
  async create(
    @Body()
    dto:
      CreatePaymentDto,

    @Headers('x-request-id')
    requestId?:
      string,

    @Headers('x-actor-id')
    actorId?:
      string,
  ) {
    return this.success(
      await this.service.create(
        dto,
        {
          correlationId:
            requestId,

          actorId,
        },
      ),
    );
  }

  @Get()
  @RequirePermission(
    PAYMENT_PERMISSIONS.READ,
  )
  async list(
    @Query()
    query:
      ListPaymentsQueryDto,
  ) {
    return this.success(
      await this.service.list(
        query,
      ),
    );
  }

  @Get(':id')
  @RequirePermission(
    PAYMENT_PERMISSIONS.READ,
  )
  async findById(
    @Param('id')
    id:
      string,
  ) {
    return this.success(
      await this.service
        .findById(id),
    );
  }

  @Post(':id/capture')
  @RequirePermission(
    PAYMENT_PERMISSIONS.MANAGE,
  )
  async capture(
    @Param('id')
    id:
      string,

    @Body()
    dto:
      CapturePaymentDto,

    @Headers('x-request-id')
    requestId?:
      string,

    @Headers('x-actor-id')
    actorId?:
      string,
  ) {
    return this.success(
      await this.service.capture(
        id,
        dto,
        {
          correlationId:
            requestId,

          actorId,
        },
      ),
    );
  }

  @Post(':id/refund')
  @RequirePermission(
    PAYMENT_PERMISSIONS.MANAGE,
  )
  async refund(
    @Param('id')
    id:
      string,

    @Body()
    dto:
      RefundPaymentDto,

    @Headers('x-request-id')
    requestId?:
      string,

    @Headers('x-actor-id')
    actorId?:
      string,
  ) {
    return this.success(
      await this.service.refund(
        id,
        dto,
        {
          correlationId:
            requestId,

          actorId,
        },
      ),
    );
  }

  private success(
    data:
      unknown,
  ) {
    return {
      success:
        true,

      data,
    };
  }
}
