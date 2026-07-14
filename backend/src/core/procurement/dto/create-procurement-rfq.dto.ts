export class CreateProcurementRfqDto {
  purchaseRequestId!: string;

  title!: string;
  description?: string;

  quotationDeadline!: string;
  deliveryRequiredBy?: string;

  currency = 'INR';
  termsAndConditions?: string;

  vendorIds!: string[];

  createdByPersonId!: string;
}
