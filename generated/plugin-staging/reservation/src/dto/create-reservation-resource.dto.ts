import {
  ReservationResourceType,
} from '../types/reservation.types';

export class CreateReservationResourceDto {
  propertyId!: string;
  zoneId?: string;
  spaceId?: string;

  code!: string;
  name!: string;
  description?: string;

  resourceType: ReservationResourceType =
    ReservationResourceType.FACILITY;

  capacity = 1;

  requiresApproval = false;

  minimumDurationMinutes = 30;
  maximumDurationMinutes?: number;
  bookingIntervalMinutes = 30;

  advanceBookingDays = 30;
  minimumNoticeMinutes = 0;

  openingTime?: string;
  closingTime?: string;
}
