import { CreateInvoiceDto } from '../dto/create-invoice.dto';
import { Invoice } from '../types';

export const INVOICE_REPOSITORY = 'INVOICE_REPOSITORY';

export interface InvoiceRepository {
  create(data: CreateInvoiceDto & { invoiceNumber: string }): Promise<Invoice>;
  findAll(): Promise<Invoice[]>;
  findById(id: string): Promise<Invoice | null>;
  findByInvoiceNumber(invoiceNumber: string): Promise<Invoice | null>;
}
