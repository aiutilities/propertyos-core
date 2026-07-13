import {
  ReservationResourceType,
} from '../types/reservation.types';

export class UpdateReservationResourceDto {
  zoneId?: string;
  spaceId?: string;

  name?: string;
  description?: string;

  resourceType?: ReservationResourceType;

  capacity?: number;

  requiresApproval?: boolean;
  isActive?: boolean;

  minimumDurationMinutes?: number;
  maximumDurationMinutes?: number;
  bookingIntervalMinutes?: number;

  advanceBookingDays?: number;
  minimumNoticeMinutes?: number;

  openingTime?: string;
  closingTime?: string;
}
