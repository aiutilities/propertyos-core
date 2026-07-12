export class CreateReservationDto {
  resourceId!: string;
  propertyId!: string;

  requesterPersonId!: string;
  beneficiaryPersonId?: string;

  title!: string;
  description?: string;

  startAt!: string;
  endAt!: string;

  attendeeCount = 1;

  notes?: string;
}
