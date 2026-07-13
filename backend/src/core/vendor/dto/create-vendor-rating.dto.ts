export class CreateVendorRatingDto {
  vendorId!: string;

  workOrderId?: string;
  propertyId?: string;

  ratedByPersonId!: string;

  rating!: number;

  qualityRating?: number;
  timelinessRating?: number;
  professionalismRating?: number;

  comments?: string;
}
