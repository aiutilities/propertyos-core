export class UpdatePropertyDto {
  name?: string;
  code?: string;
  propertyType?: string;
  description?: string;

  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  isActive?: boolean;
}
