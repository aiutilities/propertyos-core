export class CreateVisitorInviteDto {
  visitorName!: string;
  mobile!: string;
  email?: string;
  visitDate!: string;
  visitPurpose?: string;
  hostPersonId!: string;
  propertyId!: string;
}
