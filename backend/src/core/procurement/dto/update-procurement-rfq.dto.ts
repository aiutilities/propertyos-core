export class UpdateProcurementRfqDto {
  title?: string;
  description?: string;

  quotationDeadline?: string;
  deliveryRequiredBy?: string;

  currency?: string;
  termsAndConditions?: string;

  vendorIds?: string[];

  updatedByPersonId!: string;
}
