import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
} from '@nestjs/swagger';

import {
  RequirePermission,
} from '@propertyos/core-contracts';
import {
  JwtAuthGuard,
} from '@propertyos/core-contracts';
import {
  PermissionGuard,
} from '@propertyos/core-contracts';
import {
  RESERVATION_PERMISSIONS,
} from '../reservation.constants';
import {
  ApproveReservationDto,
} from '../dto/approve-reservation.dto';
import {
  CancelReservationDto,
} from '../dto/cancel-reservation.dto';
import {
  CheckAvailabilityDto,
} from '../dto/check-availability.dto';
import {
  CreateReservationDto,
} from '../dto/create-reservation.dto';
import {
  CreateReservationResourceDto,
} from '../dto/create-reservation-resource.dto';
import {
  CreateResourceBlockDto,
} from '../dto/create-resource-block.dto';
import {
  RejectReservationDto,
} from '../dto/reject-reservation.dto';
import {
  TransitionReservationDto,
} from '../dto/transition-reservation.dto';
import {
  UpdateReservationDto,
} from '../dto/update-reservation.dto';
import {
  UpdateReservationResourceDto,
} from '../dto/update-reservation-resource.dto';
import {
  ReservationService,
} from '../services/reservation.service';
import {
  ReservationResourceType,
  ReservationStatus,
} from '../types/reservation.types';

@ApiTags('Reservations')
@ApiBearerAuth('JWT')
@UseGuards(
  JwtAuthGuard,
  PermissionGuard,
)
@Controller('/reservations')
export class ReservationController {
  constructor(
    private readonly reservationService:
      ReservationService,
  ) {}

  @RequirePermission(
    RESERVATION_PERMISSIONS.READ,
  )
  @Get('resources')
  async listResources(
    @Query('propertyId')
    propertyId?: string,
    @Query('zoneId')
    zoneId?: string,
    @Query('spaceId')
    spaceId?: string,
    @Query('resourceType')
    resourceType?:
      ReservationResourceType,
    @Query('isActive')
    isActive?: string,
    @Query('search')
    search?: string,
  ) {
    return this.success(
      await this.reservationService
        .listResources({
          propertyId,
          zoneId,
          spaceId,
          resourceType,
          isActive:
            this.optionalBoolean(
              isActive,
            ),
          search,
        }),
    );
  }

  @RequirePermission(
    RESERVATION_PERMISSIONS.CREATE,
  )
  @Post('resources')
  async createResource(
    @Body()
    dto: CreateReservationResourceDto,
  ) {
    return this.success(
      await this.reservationService
        .createResource(dto),
    );
  }

  @RequirePermission(
    RESERVATION_PERMISSIONS.READ,
  )
  @Get('resources/:id')
  async getResource(
    @Param('id') id: string,
  ) {
    return this.success(
      await this.reservationService
        .getResource(id),
    );
  }

  @RequirePermission(
    RESERVATION_PERMISSIONS.UPDATE,
  )
  @Patch('resources/:id')
  async updateResource(
    @Param('id') id: string,
    @Body()
    dto: UpdateReservationResourceDto,
  ) {
    return this.success(
      await this.reservationService
        .updateResource(id, dto),
    );
  }

  @RequirePermission(
    RESERVATION_PERMISSIONS.CREATE,
  )
  @Post('resources/:id/blocks')
  async createResourceBlock(
    @Param('id') id: string,
    @Body()
    dto: CreateResourceBlockDto,
  ) {
    return this.success(
      await this.reservationService
        .createResourceBlock(id, dto),
    );
  }

  @RequirePermission(
    RESERVATION_PERMISSIONS.READ,
  )
  @Get('resources/:id/blocks')
  async listResourceBlocks(
    @Param('id') id: string,
    @Query('startsFrom')
    startsFrom?: string,
    @Query('startsUntil')
    startsUntil?: string,
  ) {
    return this.success(
      await this.reservationService
        .listResourceBlocks(
          id,
          startsFrom,
          startsUntil,
        ),
    );
  }

  @RequirePermission(
    RESERVATION_PERMISSIONS.READ,
  )
  @Post('availability')
  async checkAvailability(
    @Body()
    dto: CheckAvailabilityDto,
  ) {
    return this.success(
      await this.reservationService
        .checkAvailability(dto),
    );
  }

  @RequirePermission(
    RESERVATION_PERMISSIONS.READ,
  )
  @Get()
  async listReservations(
    @Query('propertyId')
    propertyId?: string,
    @Query('resourceId')
    resourceId?: string,
    @Query('requesterPersonId')
    requesterPersonId?: string,
    @Query('beneficiaryPersonId')
    beneficiaryPersonId?: string,
    @Query('status')
    status?: ReservationStatus,
    @Query('startsFrom')
    startsFrom?: string,
    @Query('startsUntil')
    startsUntil?: string,
    @Query('search')
    search?: string,
  ) {
    return this.success(
      await this.reservationService
        .listReservations({
          propertyId,
          resourceId,
          requesterPersonId,
          beneficiaryPersonId,
          status,
          startsFrom:
            this.optionalDate(
              startsFrom,
            ),
          startsUntil:
            this.optionalDate(
              startsUntil,
            ),
          search,
        }),
    );
  }

  @RequirePermission(
    RESERVATION_PERMISSIONS.CREATE,
  )
  @Post()
  async createReservation(
    @Body()
    dto: CreateReservationDto,
  ) {
    return this.success(
      await this.reservationService
        .createReservation(dto),
    );
  }

  @RequirePermission(
    RESERVATION_PERMISSIONS.READ,
  )
  @Get('metrics')
  async metrics(
    @Query('propertyId')
    propertyId?: string,
  ) {
    return this.success(
      await this.reservationService
        .getMetrics(propertyId),
    );
  }

  @RequirePermission(
    RESERVATION_PERMISSIONS.READ,
  )
  @Get(':id')
  async getReservation(
    @Param('id') id: string,
  ) {
    return this.success(
      await this.reservationService
        .getReservation(id),
    );
  }

  @RequirePermission(
    RESERVATION_PERMISSIONS.UPDATE,
  )
  @Patch(':id')
  async updateReservation(
    @Param('id') id: string,
    @Body()
    dto: UpdateReservationDto,
  ) {
    return this.success(
      await this.reservationService
        .updateReservation(id, dto),
    );
  }

  @RequirePermission(
    RESERVATION_PERMISSIONS.APPROVE,
  )
  @Post(':id/approve')
  async approve(
    @Param('id') id: string,
    @Body()
    dto: ApproveReservationDto,
  ) {
    return this.success(
      await this.reservationService
        .approve(id, dto),
    );
  }

  @RequirePermission(
    RESERVATION_PERMISSIONS.APPROVE,
  )
  @Post(':id/reject')
  async reject(
    @Param('id') id: string,
    @Body()
    dto: RejectReservationDto,
  ) {
    return this.success(
      await this.reservationService
        .reject(id, dto),
    );
  }

  @RequirePermission(
    RESERVATION_PERMISSIONS.CANCEL,
  )
  @Post(':id/cancel')
  async cancel(
    @Param('id') id: string,
    @Body()
    dto: CancelReservationDto,
  ) {
    return this.success(
      await this.reservationService
        .cancel(id, dto),
    );
  }

  @RequirePermission(
    RESERVATION_PERMISSIONS.MANAGE,
  )
  @Post(':id/check-in')
  async checkIn(
    @Param('id') id: string,
    @Body()
    dto: TransitionReservationDto,
  ) {
    return this.success(
      await this.reservationService
        .checkIn(id, dto),
    );
  }

  @RequirePermission(
    RESERVATION_PERMISSIONS.MANAGE,
  )
  @Post(':id/complete')
  async complete(
    @Param('id') id: string,
    @Body()
    dto: TransitionReservationDto,
  ) {
    return this.success(
      await this.reservationService
        .complete(id, dto),
    );
  }

  @RequirePermission(
    RESERVATION_PERMISSIONS.MANAGE,
  )
  @Post(':id/no-show')
  async markNoShow(
    @Param('id') id: string,
    @Body()
    dto: TransitionReservationDto,
  ) {
    return this.success(
      await this.reservationService
        .markNoShow(id, dto),
    );
  }

  private optionalDate(
    value?: string,
  ): Date | undefined {
    if (!value) {
      return undefined;
    }

    const parsed = new Date(value);

    return Number.isNaN(
      parsed.getTime(),
    )
      ? undefined
      : parsed;
  }

  private optionalBoolean(
    value?: string,
  ): boolean | undefined {
    if (value === undefined) {
      return undefined;
    }

    if (value === 'true') {
      return true;
    }

    if (value === 'false') {
      return false;
    }

    return undefined;
  }

  private success(data: unknown) {
    return {
      success: true,
      data,
    };
  }
}
