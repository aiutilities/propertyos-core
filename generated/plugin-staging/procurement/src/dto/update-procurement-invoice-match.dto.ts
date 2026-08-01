import {
  CreateProcurementInvoiceMatchItemDto,
} from './create-procurement-invoice-match.dto';

export class UpdateProcurementInvoiceMatchDto {
  externalInvoiceNumber?: string;

  invoiceDate?: string;

  invoiceAmount?: number;

  remarks?: string;

  items?: CreateProcurementInvoiceMatchItemDto[];

  updatedByPersonId!: string;
}
