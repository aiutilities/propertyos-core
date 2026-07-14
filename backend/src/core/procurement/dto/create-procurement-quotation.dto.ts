export class CreateProcurementQuotationItemDto {
  rfqItemId!: string;

  description?: string;

  quantity!: number;
  unit!: string;
  unitPrice!: number;

  discountAmount = 0;
  taxRate = 0;

  deliveryDays?: number;
  remarks?: string;
}

export class CreateProcurementQuotationDto {
  rfqId!: string;
  vendorId!: string;

  vendorReference?: string;
  quotationDate?: string;
  validUntil!: string;

  deliveryDays?: number;

  discountAmount = 0;
  freightAmount = 0;

  currency = 'INR';

  paymentTerms?: string;
  deliveryTerms?: string;
  notes?: string;

  submittedByPersonId!: string;

  items!: CreateProcurementQuotationItemDto[];
}
