export class UpdateReservationDto {
  beneficiaryPersonId?: string;

  title?: string;
  description?: string;

  startAt?: string;
  endAt?: string;

  attendeeCount?: number;

  notes?: string;
}
