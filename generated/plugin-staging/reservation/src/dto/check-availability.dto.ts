export class CheckAvailabilityDto {
  resourceId!: string;
  startAt!: string;
  endAt!: string;
  excludeReservationId?: string;
}
