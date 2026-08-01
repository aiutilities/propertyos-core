import { Injectable } from '@nestjs/common';

import {
  AuditService,
} from '@propertyos/core-contracts';
import {
  EventBusService,
} from '@propertyos/core-contracts';
import {
  RESERVATION_EVENTS,
} from '../reservation.constants';
import {
  ReservationStatus,
} from '../types/reservation.types';
import {
  ReservationService,
} from './reservation.service';

@Injectable()
export class ReservationSchedulerService {
  constructor(
    private readonly reservationService:
      ReservationService,
    private readonly eventBus:
      EventBusService,
    private readonly auditService:
      AuditService,
  ) {}

  async processReminder(
    reservationId: string,
  ): Promise<void> {
    const reservation =
      await this.reservationService
        .getReservation(reservationId);

    if (
      ![
        ReservationStatus.PENDING,
        ReservationStatus.APPROVED,
      ].includes(reservation.status)
    ) {
      return;
    }

    if (
      reservation.endAt.getTime() <=
      Date.now()
    ) {
      return;
    }

    const payload = {
      entityType: 'reservation',
      entityId: reservation.id,
      reservationId: reservation.id,
      reservationNumber:
        reservation.reservationNumber,
      title: reservation.title,
      propertyId: reservation.propertyId,
      resourceId: reservation.resourceId,
      requesterPersonId:
        reservation.requesterPersonId,
      beneficiaryPersonId:
        reservation.beneficiaryPersonId,
      status: reservation.status,
      startAt: reservation.startAt,
      endAt: reservation.endAt,
    };

    await this.eventBus.publish(
      RESERVATION_EVENTS.REMINDER,
      'scheduler.reservation',
      payload,
      {
        correlationId: reservation.id,
        metadata: {
          module: 'reservation',
          automation: 'reminder',
        },
      },
    );

    await this.auditService.record(
      RESERVATION_EVENTS.REMINDER,
      'scheduler.reservation',
      payload,
    );
  }

  async processReservationEnd(
    reservationId: string,
  ): Promise<void> {
    const reservation =
      await this.reservationService
        .getReservation(reservationId);

    if (
      reservation.endAt.getTime() >
      Date.now()
    ) {
      return;
    }

    if (
      reservation.status ===
      ReservationStatus.APPROVED
    ) {
      await this.reservationService
        .markNoShow(
          reservation.id,
          {
            changedByPersonId:
              reservation.requesterPersonId,
            remarks:
              'Automatically marked as no-show after reservation end time',
          },
        );

      return;
    }

    if (
      reservation.status ===
      ReservationStatus.CHECKED_IN
    ) {
      await this.reservationService
        .complete(
          reservation.id,
          {
            changedByPersonId:
              reservation.requesterPersonId,
            remarks:
              'Automatically completed after reservation end time',
          },
        );
    }
  }
}
