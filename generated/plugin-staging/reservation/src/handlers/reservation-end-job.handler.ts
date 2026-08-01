import {
  BadRequestException,
  Injectable,
  OnModuleInit,
} from '@nestjs/common';

import {
  SchedulerHandlerRegistry,
} from '@propertyos/core-contracts';
import {
  SchedulerJob,
  SchedulerJobHandler,
} from '@propertyos/core-contracts';
import {
  RESERVATION_END_JOB_TYPE,
} from '../reservation.constants';
import {
  ReservationSchedulerService,
} from '../services/reservation-scheduler.service';
import {
  ReservationJobPayload,
} from '../types/reservation-job.types';

@Injectable()
export class ReservationEndJobHandler
  implements SchedulerJobHandler, OnModuleInit
{
  readonly jobType =
    RESERVATION_END_JOB_TYPE;

  constructor(
    private readonly registry:
      SchedulerHandlerRegistry,
    private readonly schedulerService:
      ReservationSchedulerService,
  ) {}

  onModuleInit(): void {
    this.registry.register(this);
  }

  async handle(
    job: SchedulerJob,
  ): Promise<void> {
    const payload =
      this.validate(job.payload);

    await this.schedulerService
      .processReservationEnd(
        payload.reservationId,
      );
  }

  private validate(
    payload: Record<string, unknown>,
  ): ReservationJobPayload {
    if (
      typeof payload.reservationId !==
        'string' ||
      !payload.reservationId.trim()
    ) {
      throw new BadRequestException(
        'Reservation end job requires reservationId',
      );
    }

    return {
      reservationId:
        payload.reservationId,
      reservationNumber:
        typeof payload
          .reservationNumber === 'string'
          ? payload.reservationNumber
          : '',
      propertyId:
        typeof payload.propertyId ===
        'string'
          ? payload.propertyId
          : '',
      requesterPersonId:
        typeof payload
          .requesterPersonId === 'string'
          ? payload.requesterPersonId
          : '',
    };
  }
}
