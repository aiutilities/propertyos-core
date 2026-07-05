import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateInvoiceDto } from '../dto/create-invoice.dto';
import {
  INVOICE_REPOSITORY,
  InvoiceRepository,
} from '../repositories/invoice-repository.interface';
import { Invoice } from '../types';

@Injectable()
export class InvoiceService {
  constructor(
    @Inject(INVOICE_REPOSITORY)
    private readonly invoiceRepository: InvoiceRepository,
  ) {}

  async create(data: CreateInvoiceDto): Promise<Invoice> {
    const invoiceNumber = await this.generateInvoiceNumber(data.invoiceDate);

    return this.invoiceRepository.create({
      ...data,
      invoiceNumber,
    });
  }

  async findAll(): Promise<Invoice[]> {
    return this.invoiceRepository.findAll();
  }

  async findById(id: string): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findById(id);

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return invoice;
  }

  private async generateInvoiceNumber(invoiceDate: string): Promise<string> {
    const compactDate = invoiceDate.replace(/-/g, '');
    let sequence = 1;

    while (true) {
      const invoiceNumber = `INV-${compactDate}-${String(sequence).padStart(3, '0')}`;
      const existing = await this.invoiceRepository.findByInvoiceNumber(invoiceNumber);

      if (!existing) {
        return invoiceNumber;
      }

      sequence += 1;
    }
  }
}
