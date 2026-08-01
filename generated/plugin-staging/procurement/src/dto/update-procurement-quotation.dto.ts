import {
  CreateProcurementQuotationItemDto,
} from './create-procurement-quotation.dto';

export class UpdateProcurementQuotationDto {
  vendorReference?: string;
  quotationDate?: string;
  validUntil?: string;

  deliveryDays?: number;

  discountAmount?: number;
  freightAmount?: number;

  currency?: string;

  paymentTerms?: string;
  deliveryTerms?: string;
  notes?: string;

  updatedByPersonId!: string;

  items?: CreateProcurementQuotationItemDto[];
}
